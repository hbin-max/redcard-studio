
$ws = New-Object -ComObject WScript.Shell
$s = $ws.CreateShortcut('C:\\Users\\黄斌\\Desktop\\RedCard Studio.lnk')
$s.TargetPath = 'C:\\Users\\黄斌\\Desktop\\AI产品设计\\小红书帖子生成器\\RedCard_Studio.exe'
$s.WorkingDirectory = 'C:\\Users\\黄斌\\Desktop\\AI产品设计\\小红书帖子生成器'
$s.IconLocation = 'C:\\Users\\黄斌\\Desktop\\AI产品设计\\小红书帖子生成器\\app.ico'
$s.Description = 'RedCard Studio - 小红书干货/测评图文生成器'
$s.Save()
