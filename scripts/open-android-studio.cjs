const { execFileSync, spawn } = require('node:child_process');
const { existsSync } = require('node:fs');
const { dirname, join, resolve } = require('node:path');

const registryLookup = `
  [Console]::OutputEncoding = [Text.UTF8Encoding]::new($false)
  $locations = @('HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*',
    'HKLM:\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*',
    'HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*')
  Get-ItemProperty $locations -ErrorAction SilentlyContinue |
    Where-Object DisplayName -Like 'Android Studio*' |
    ForEach-Object { $_.DisplayIcon -replace ',\\d+$', '' }
  exit 0
`;

const configuredPath = process.env.CAPACITOR_ANDROID_STUDIO_PATH;
const defaultPath = join(process.env.ProgramFiles || 'C:\\Program Files', 'Android', 'Android Studio', 'bin', 'studio64.exe');
let studio = [configuredPath, defaultPath].find(candidate => candidate && existsSync(candidate));

if (!studio) {
  try {
    const registered = execFileSync('powershell.exe', ['-NoProfile', '-Command', registryLookup], { encoding: 'utf8' });
    const icons = registered.split(/\r?\n/).map(line => line.trim().replace(/^"|"$/g, '')).filter(Boolean);
    studio = icons.flatMap(icon => [join(dirname(icon), 'studio64.exe'), icon]).find(existsSync);
  } catch {
    // A custom installation can still be declared through the environment variable.
  }
}

if (!studio) {
  console.error('找不到 Android Studio。请安装后重试，或通过 CAPACITOR_ANDROID_STUDIO_PATH 指定完整的程序路径。');
  process.exitCode = 1;
} else {
  const child = spawn(studio, [resolve('android')], { detached: true, stdio: 'ignore' });
  child.on('error', (error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
  child.unref();
}
