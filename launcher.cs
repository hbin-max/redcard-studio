using System;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Threading;
using System.Windows.Forms;

namespace RedCardStudio
{
    static class Program
    {
        private static HttpListener _listener;
        private static string _webRoot;
        private static int _port;
        private static bool _isRunning = true;

        [STAThread]
        static void Main()
        {
            try
            {
                // 1. 定位静态资源目录
                string baseDir = AppDomain.CurrentDomain.BaseDirectory;
                _webRoot = Path.Combine(baseDir, "dist");
                
                if (!Directory.Exists(_webRoot))
                {
                    // 兼容开发目录或上一层目录
                    if (Directory.Exists(Path.Combine(baseDir, "..", "dist")))
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
                string browserPath = FindBrowser();

                if (!string.IsNullOrEmpty(browserPath))
                {
                    string profileDir = Path.Combine(
                        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                        "RedCardStudio", "Profile"
                    );

                    ProcessStartInfo psi = new ProcessStartInfo();
                    psi.FileName = browserPath;
                    // --app 模式会移除地址栏、标签页，呈现纯粹的独立原生桌面窗口体验
                    psi.Arguments = string.Format(
                        "--app=\"{0}\" --window-size=1400,900 --user-data-dir=\"{1}\" --app-id=RedCardStudio",
                        targetUrl, profileDir
                    );
                    psi.UseShellExecute = false;

                    Process p = Process.Start(psi);
                    if (p != null)
                    {
                        // 当用户关闭应用窗口时，自动退出后台监听服务
                        p.WaitForExit();
                    }
                }
                else
                {
                    // 若无独立 Edge/Chrome，使用系统默认浏览器打开
                    Process.Start(targetUrl);
                    // 保持服务运行
                    Thread.Sleep(3000);
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
                    try { _listener.Stop(); } catch { }
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
                string rawUrl = context.Request.Url.AbsolutePath;
                string relPath = rawUrl.TrimStart('/');
                if (string.IsNullOrEmpty(relPath))
                {
                    relPath = "index.html";
                }

                string localPath = Path.Combine(_webRoot, relPath.Replace('/', Path.DirectorySeparatorChar));

                // SPA 路由回退：如果不是静态文件请求且不存在，回退到 index.html
                if (!File.Exists(localPath))
                {
                    localPath = Path.Combine(_webRoot, "index.html");
                }

                if (File.Exists(localPath))
                {
                    byte[] bytes = File.ReadAllBytes(localPath);
                    string ext = Path.GetExtension(localPath).ToLower();
                    context.Response.ContentType = GetMimeType(ext);
                    context.Response.ContentLength64 = bytes.Length;
                    context.Response.AddHeader("Cache-Control", "no-cache");
                    context.Response.OutputStream.Write(bytes, 0, bytes.Length);
                }
                else
                {
                    context.Response.StatusCode = 404;
                    byte[] notFound = Encoding.UTF8.GetBytes("404 Not Found");
                    context.Response.OutputStream.Write(notFound, 0, notFound.Length);
                }
            }
            catch { }
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
