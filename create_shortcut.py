import os
import win32com.client

try:
    desktop = os.path.expanduser(r"C:\Users\devan\OneDrive\Desktop")
    shortcut_path = os.path.join(desktop, "VERAXIS AI.lnk")
    project_dir = r"d:\LetsCode\My_Project\MULTIINTELIGENCE"
    vbs_path = os.path.join(project_dir, "launch_veraxis_silent.vbs")
    ico_path = os.path.join(project_dir, "assets", "veraxis_app.ico")

    shell = win32com.client.Dispatch("WScript.Shell")
    shortcut = shell.CreateShortcut(shortcut_path)
    shortcut.TargetPath = "wscript.exe"
    shortcut.Arguments = f'"{vbs_path}"'
    shortcut.WorkingDirectory = project_dir
    shortcut.IconLocation = f"{ico_path},0"
    shortcut.Description = "VERAXIS AI - Autonomous Multi-Agent Research Engine"
    shortcut.Save()

    print(f"SUCCESS: Desktop shortcut generated at {shortcut_path}")
except Exception as e:
    print(f"ERROR: {e}")
