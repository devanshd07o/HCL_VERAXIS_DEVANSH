Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "d:\LetsCode\My_Project\MULTIINTELIGENCE"
WshShell.Run "cmd /c launch_veraxis.bat", 0, False
