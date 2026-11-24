const { spawnSync } = require('node:child_process');
const { copyFileSync } = require('node:fs');
const { join } = require('node:path');

const compiler = join(process.env.WINDIR || 'C:\\Windows', 'Microsoft.NET', 'Framework64', 'v4.0.30319', 'csc.exe');
const result = spawnSync(compiler, [
  '/target:winexe', '/codepage:65001', '/reference:System.Management.dll', '/win32icon:app.ico', '/out:RedCard Studio.exe', 'launcher.cs',
], { stdio: 'inherit' });

if (result.error) console.error(result.error.message);
process.exitCode = result.status ?? 1;
if (result.status === 0) {
  copyFileSync('RedCard Studio.exe', 'RedCard_Studio.exe');
  copyFileSync('RedCard Studio.exe', 'public/RedCard_Studio.exe');
}
