Dim oWS, oLink, sDesktop, sDir
Set oWS = CreateObject("WScript.Shell")
sDesktop = oWS.SpecialFolders("Desktop")
sDir = oWS.CurrentDirectory

Set oLink = oWS.CreateShortcut(sDesktop & "\RedCard Studio.lnk")
oLink.TargetPath = sDir & "\RedCard_Studio.exe"
oLink.WorkingDirectory = sDir
oLink.IconLocation = sDir & "\app.ico, 0"
oLink.Description = "RedCard Studio"
oLink.Save

WScript.Echo "SUCCESS"
