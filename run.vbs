Set WshShell = CreateObject("WScript.Shell")
Set FSO = CreateObject("Scripting.FileSystemObject")
launcherFolder = FSO.GetParentFolderName(WScript.ScriptFullName)
userProfile = WshShell.ExpandEnvironmentStrings("%USERPROFILE%")
cargoBin = userProfile & "\.cargo\bin"
currentPath = WshShell.ExpandEnvironmentStrings("%PATH%")
WshShell.CurrentDirectory = launcherFolder
WshShell.Environment("PROCESS")("PATH") = cargoBin & ";" & currentPath
WshShell.Environment("PROCESS")("CARGO_HOME") = userProfile & "\.cargo"
WshShell.Run "npm run tauri dev", 0, False
