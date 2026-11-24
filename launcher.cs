using System;
using System.Diagnostics;
using System.IO;
using System.Management;
using System.Net;
using System.Net.Sockets;
using System.Threading;
using System.Windows.Forms;

namespace RedCardStudio
{
    static class Program
    {
        private static HttpListener _listener;
        private static string _webRoot;
        private static int _port;
        private static volatile bool _isRunning = true;

        [STAThread]
        static void Main()
        {
            bool firstInstance;
            using (var instance = new Mutex(true, @"Local\RedCardStudio", out firstInstance))
            {
                if (!firstInstance)
                {
                    MessageBox.Show("RedCard Studio 已在运行。", "RedCard Studio");
                    return;
                }
                Run();
            }
        }

        private static void Run()
        {
            try
            {
                // 1. 定位静态资源目录
                string baseDir = AppDomain.CurrentDomain.BaseDirectory;
                _webRoot = Path.Combine(baseDir, "dist");
                
                if (!File.Exists(Path.Combine(_webRoot, "index.html")))
                {
                    // 兼容开发目录或上一层目录
                    if (File.Exists(Path.Combine(baseDir, "..", "dist", "index.html")))
                    {
                        _webRoot = Path.GetFullPath(Path.Combine(baseDir, "..", "dist"));
                    }
                    else
                    {
                        MessageBox.Show(
                            "未检测到网页资源目录 (dist)！\n请确保 RedCard Studio.exe 与 dist 文件夹位于同一目录下，或者在当前目录执行过 npm run build。",
                            "RedCard Studio 启动提示",
                            MessageBoxButtons.OK,
                            MessageBoxIcon.Warning
                        );
                        return;
                    }
                }

                _webRoot = Path.GetFullPath(_webRoot).TrimEnd(Path.DirectorySeparatorChar) + Path.DirectorySeparatorChar;
                string browserPath = FindBrowser();
                if (string.IsNullOrEmpty(browserPath))
                {
                    MessageBox.Show("请先安装 Microsoft Edge 或 Google Chrome，再运行 RedCard Studio。", "RedCard Studio");
                    return;
                }

                // 2. 获取可用端口 (首选 19899，占用则自增)
                _port = GetAvailablePort(19899);

                // 3. 启动内置 HTTP 服务
                _listener = new HttpListener();
                _listener.Prefixes.Add("http://127.0.0.1:" + _port + "/");
                _listener.Start();

                Thread serverThread = new Thread(ListenRequests);
                serverThread.IsBackground = true;
                serverThread.Start();

                // 4. 定位 Edge 或 Chrome 浏览器并启动 App 独立窗口
                string targetUrl = "http://127.0.0.1:" + _port + "/";
                string profileDir = Path.Combine(
                    Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                    "RedCardStudio", "Profile"
                );
                var browser = new ProcessStartInfo(browserPath, string.Format(
                    "--app=\"{0}\" --window-size=1400,900 --user-data-dir=\"{1}\" --disable-background-mode --no-first-run",
                    targetUrl, profileDir)) { UseShellExecute = false };
                using (Process launcher = Process.Start(browser))
                {
                    // Edge can launch another process and exit before the app window closes.
                    if (launcher != null) launcher.WaitForExit(500);
                    using (Process appBrowser = FindProfileProcess(browserPath, profileDir))
                    {
                        if (appBrowser != null) appBrowser.WaitForExit();
                        else if (launcher != null && !launcher.HasExited) launcher.WaitForExit();
                    }
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show("启动失败: " + ex.Message, "RedCard Studio", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
            finally
            {
                _isRunning = false;
                if (_listener != null && _listener.IsListening)
                {
                    _listener.Close();
                }
            }
        }

        private static int GetAvailablePort(int startPort)
        {
            for (int port = startPort; port < startPort + 50; port++)
            {
                try
                {
                    TcpListener tcp = new TcpListener(IPAddress.Loopback, port);
                    tcp.Start();
                    tcp.Stop();
                    return port;
                }
                catch { }
            }
            return startPort;
        }

        private static string FindBrowser()
        {
            string[] candidates = new string[]
            {
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), @"Microsoft\Edge\Application\msedge.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), @"Microsoft\Edge\Application\msedge.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), @"Google\Chrome\Application\chrome.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), @"Google\Chrome\Application\chrome.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), @"Microsoft\Edge SxS\Application\msedge.exe")
            };

            foreach (string path in candidates)
            {
                if (File.Exists(path))
                {
                    return path;
                }
            }
            return null;
        }

        private static Process FindProfileProcess(string browserPath, string profileDir)
        {
            string query = "SELECT ProcessId, CommandLine FROM Win32_Process WHERE Name = '" + Path.GetFileName(browserPath) + "'";
            using (var searcher = new ManagementObjectSearcher(query))
            {
                for (int attempt = 0; attempt < 20; attempt++)
                {
                    try
                    {
                        using (var processes = searcher.Get())
                        {
                            foreach (ManagementObject item in processes)
                            {
                                using (item)
                                {
                                    string command = item["CommandLine"] as string;
                                    if (command == null || command.IndexOf(profileDir, StringComparison.OrdinalIgnoreCase) < 0 ||
                                        command.IndexOf("--user-data-dir=", StringComparison.OrdinalIgnoreCase) < 0 ||
                                        command.IndexOf("--type=", StringComparison.OrdinalIgnoreCase) >= 0) continue;

                                    try { return Process.GetProcessById(Convert.ToInt32(item["ProcessId"])); }
                                    catch (ArgumentException) { }
                                }
                            }
                        }
                    }
                    catch (ManagementException) { return null; }
                    catch (UnauthorizedAccessException) { return null; }
                    Thread.Sleep(150);
                }
            }
            return null;
        }

        private static void ListenRequests()
        {
            while (_isRunning && _listener.IsListening)
            {
                try
                {
                    HttpListenerContext context = _listener.GetContext();
                    ThreadPool.QueueUserWorkItem(ProcessContext, context);
                }
                catch
                {
                    if (!_isRunning) break;
                }
            }
        }

        private static void ProcessContext(object state)
        {
            HttpListenerContext context = (HttpListenerContext)state;
            try
            {
                bool isHead = context.Request.HttpMethod == "HEAD";
                if (context.Request.HttpMethod != "GET" && !isHead)
                {
                    context.Response.StatusCode = 405;
                    context.Response.AddHeader("Allow", "GET, HEAD");
                    return;
                }

                string relPath = Uri.UnescapeDataString(context.Request.Url.AbsolutePath).TrimStart('/');
                if (string.IsNullOrEmpty(relPath))
                {
                    relPath = "index.html";
                }

                string localPath = Path.GetFullPath(Path.Combine(_webRoot, relPath.Replace('/', Path.DirectorySeparatorChar)));
                if (!localPath.StartsWith(_webRoot, StringComparison.OrdinalIgnoreCase) || !File.Exists(localPath))
                {
                    context.Response.StatusCode = 404;
                    return;
                }

                context.Response.ContentType = GetMimeType(Path.GetExtension(localPath).ToLowerInvariant());
                context.Response.ContentLength64 = new FileInfo(localPath).Length;
                context.Response.AddHeader("Cache-Control", "no-cache");
                context.Response.AddHeader("X-Content-Type-Options", "nosniff");
                if (!isHead)
                {
                    using (var file = File.OpenRead(localPath)) file.CopyTo(context.Response.OutputStream);
                }
            }
            catch (ArgumentException) { context.Response.StatusCode = 400; }
            catch (IOException) { }
            catch (HttpListenerException) { }
            finally
            {
                try { context.Response.OutputStream.Close(); } catch { }
            }
        }

        private static string GetMimeType(string extension)
        {
            switch (extension)
            {
                case ".html": return "text/html; charset=utf-8";
                case ".js": return "application/javascript; charset=utf-8";
                case ".css": return "text/css; charset=utf-8";
                case ".json": return "application/json; charset=utf-8";
                case ".svg": return "image/svg+xml";
                case ".png": return "image/png";
                case ".jpg":
                case ".jpeg": return "image/jpeg";
                case ".gif": return "image/gif";
                case ".ico": return "image/x-icon";
                case ".woff": return "font/woff";
                case ".woff2": return "font/woff2";
                case ".ttf": return "font/ttf";
                case ".txt": return "text/plain; charset=utf-8";
                default: return "application/octet-stream";
            }
        }
    }
}
