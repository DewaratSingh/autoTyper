import webview
import json
import sys
import os
import subprocess
import platform

class Api:
    def __init__(self):
        self._window = None
        self.pyProcess = None
        # Determine base directory if frozen (PyInstaller) or running from source
        if getattr(sys, 'frozen', False):
            self.base_dir = sys._MEIPASS
        else:
            self.base_dir = os.path.dirname(os.path.abspath(__file__))

    def set_window(self, window):
        self._window = window

    def save_file(self, data):
        file_types = ('PDS File (*.pds)', 'All files (*.*)')
        result = self._window.create_file_dialog(
            webview.SAVE_DIALOG, 
            directory='', 
            save_filename='project.pds',
            file_types=file_types
        )
        if result and len(result) > 0:
            filepath = result[0]
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2)
            return filepath
        return None

    def load_file(self):
        result = self._window.create_file_dialog(
            webview.OPEN_DIALOG, 
            directory='', 
            allow_multiple=False
        )
        if result and len(result) > 0:
            filepath = result[0]
            ext = os.path.splitext(filepath)[1].lower()
            if ext == '.pds':
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = json.load(f)
                return {"path": filepath, "content": content}
            else:
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                return {"path": filepath, "content": content}
        return None

    def start_typing(self, file_path, data):
        temp_path = os.path.join(self.base_dir, "code.json")
        with open(temp_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)
            
        typer_script = os.path.join(self.base_dir, "typer.py")
        
        # Hide the console window on Windows
        startupinfo = None
        if platform.system() == "Windows":
            startupinfo = subprocess.STARTUPINFO()
            startupinfo.dwFlags |= subprocess.STARTF_USESHOWWINDOW
            startupinfo.wShowWindow = subprocess.SW_HIDE

        # Run standard python command executing typer.py in the main directly
        self.pyProcess = subprocess.Popen(
            ["python", typer_script], 
            cwd=self.base_dir,
            startupinfo=startupinfo
        )

    def stop_typing(self):
        if self.pyProcess:
            if platform.system() == "Windows":
                subprocess.run(["taskkill", "/pid", str(self.pyProcess.pid), "/T", "/F"], capture_output=True)
            else:
                try:
                    self.pyProcess.kill()
                except Exception:
                    pass
            self.pyProcess = None

if __name__ == '__main__':
    api = Api()
    if getattr(sys, 'frozen', False):
        base_path = sys._MEIPASS
    else:
        base_path = os.path.dirname(os.path.abspath(__file__))
        
    html_path = os.path.join(base_path, 'index.html')
    
    window = webview.create_window(
        'AutoTyper', 
        url=f'file:///{html_path.replace(os.sep, "/")}', 
        js_api=api, 
        width=1000, 
        height=700
    )
    api.set_window(window)
    webview.start()
