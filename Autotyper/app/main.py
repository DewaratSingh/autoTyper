import webview
import json
import sys
import os
import threading
import base64
import io

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import typer

# ---------------- TK THREAD STATE ---------------- #
# Single persistent hidden Tk root + a replaceable Toplevel for each image.
# All Tk operations MUST be dispatched via _tk_root.after(0, fn) because
# tkinter is not thread-safe; only the thread owning the mainloop may
# touch widgets directly.

_tk_root    = None   # the one persistent Tk() root (withdrawn/hidden)
_tk_img_top = None   # the current Toplevel showing the full-screen image
_tk_thread  = None   # the thread running root.mainloop()
_tk_ready   = threading.Event()


def _start_tk_thread():
    """Ensure the persistent Tk main-loop thread is running."""
    global _tk_root, _tk_thread, _tk_ready

    if _tk_thread is not None and _tk_thread.is_alive():
        return

    _tk_ready.clear()

    def _run():
        global _tk_root
        import tkinter as tk
        _tk_root = tk.Tk()
        _tk_root.withdraw()
        _tk_ready.set()
        _tk_root.mainloop()

    _tk_thread = threading.Thread(target=_run, daemon=True)
    _tk_thread.start()
    _tk_ready.wait(timeout=5.0)


def _close_image_top():
    """Destroy the current image Toplevel (must be called on the Tk thread)."""
    global _tk_img_top
    if _tk_img_top is not None:
        try:
            _tk_img_top.destroy()
        except Exception:
            pass
        _tk_img_top = None


def _close_fullscreen():
    """Thread-safe: schedule Toplevel destruction on the Tk thread."""
    global _tk_root
    if _tk_root is not None:
        try:
            _tk_root.after(0, _close_image_top)
        except Exception:
            pass


def _minimize_autotyper():
    """Minimize the AutoTyper window so the IDE is exposed after image close."""
    try:
        import ctypes
        hwnd = ctypes.windll.user32.FindWindowW(None, "AutoTyper")
        if hwnd:
            ctypes.windll.user32.ShowWindow(hwnd, 6)   # SW_MINIMIZE = 6
    except Exception as e:
        print(f"[minimize_autotyper] {e}")


def _open_fullscreen_image(image_b64: str):
    """Thread-safe: schedule a new fullscreen image Toplevel on the Tk thread."""
    global _tk_root

    _start_tk_thread()
    if _tk_root is None:
        return

    try:
        from PIL import Image, ImageTk

        img_bytes = base64.b64decode(image_b64)
        pil_img   = Image.open(io.BytesIO(img_bytes))

        def _show_in_tk():
            global _tk_img_top
            import tkinter as tk

            # Close any existing image window first
            _close_image_top()

            sw = _tk_root.winfo_screenwidth()
            sh = _tk_root.winfo_screenheight()

            # Scale image to fit screen, preserve aspect ratio
            scale = min(sw / pil_img.width, sh / pil_img.height)
            nw = int(pil_img.width  * scale)
            nh = int(pil_img.height * scale)
            scaled = pil_img.resize((nw, nh), Image.LANCZOS)

            top = tk.Toplevel(_tk_root)
            top.title("PDF Slide")
            top.overrideredirect(True)
            top.geometry(f"{sw}x{sh}+0+0")
            top.attributes("-topmost", True)
            top.lift()
            top.focus_force()

            canvas = tk.Canvas(top, width=sw, height=sh, bg="black",
                               highlightthickness=0, cursor="hand2")
            canvas.pack(fill="both", expand=True)

            tk_img = ImageTk.PhotoImage(scaled)
            canvas._ref = tk_img          # prevent GC
            canvas.create_image(sw // 2, 0, anchor="n", image=tk_img)

            # Bottom hint bar
            bar_h = 48
            # canvas.create_rectangle(0, sh - bar_h, sw, sh,
            #                          fill="#000000", outline="", stipple="gray50")
            # canvas.create_text(sw // 2, sh - bar_h // 2,
            #                    text="⌨  Press F8 to continue   (or click anywhere)",
            #                    fill="white",
            #                    font=("Arial", 17, "bold"),
            #                    anchor="center")

            # ⚠ Escape is intentionally NOT bound here.
            #   The global keyboard hook maps ESC → stop_typer().
            #   Pressing Escape in this window would kill the session.
            def _close(event=None):
                """
                Close the image.
                - If the NEXT step is ALSO an image: don't minimise AutoTyper,
                  just let the next image appear normally (stays in slide-show mode).
                - If the next step is a writing/code task: minimise AutoTyper so
                  the code editor is exposed and ready for F8.
                """
                global _tk_img_top
                try:
                    top.destroy()
                except Exception:
                    pass
                _tk_img_top = None

                # Always unlock the key-release gate
                typer.waiting_for_key_release = False

                # Only expose the code editor when the next task is NOT an image
                if not typer.is_next_step_image():
                    _minimize_autotyper()

            # Close with ANY F-key (F1–F12) — most natural for the teacher
            for _fk in range(1, 13):
                top.bind(f"<F{_fk}>", _close)

            # Click also works as a fallback
            canvas.bind("<Button-1>", _close)

            _tk_img_top = top

            # Force window to the very front via Win32 HWND_TOPMOST
            def _force_front():
                try:
                    import ctypes
                    u32 = ctypes.windll.user32
                    k32 = ctypes.windll.kernel32
                    hwnd = u32.FindWindowW(None, "PDF Slide")
                    if not hwnd:
                        return
                    fg_hwnd = u32.GetForegroundWindow()
                    fg_tid  = u32.GetWindowThreadProcessId(fg_hwnd, None)
                    my_tid  = k32.GetCurrentThreadId()
                    if fg_tid and fg_tid != my_tid:
                        u32.AttachThreadInput(fg_tid, my_tid, True)
                    u32.SetWindowPos(hwnd, -1, 0, 0, sw, sh, 0x0040)
                    u32.ShowWindow(hwnd, 9)
                    u32.BringWindowToTop(hwnd)
                    u32.SetForegroundWindow(hwnd)
                    u32.SetFocus(hwnd)
                    if fg_tid and fg_tid != my_tid:
                        u32.AttachThreadInput(fg_tid, my_tid, False)
                except Exception as ex:
                    print(f"[force_front] {ex}")

            top.after(150, _force_front)

        _tk_root.after(0, _show_in_tk)

    except Exception as e:
        print(f"[fullscreen_image] {e}")


# ---------------- API CLASS ---------------- #

class Api:
    def __init__(self):
        self._window = None

        if getattr(sys, 'frozen', False):
            self.base_dir = sys._MEIPASS
        else:
            self.base_dir = os.path.dirname(os.path.abspath(__file__))

    def set_window(self, window):
        self._window = window

    # ---------------- FILE HANDLING ---------------- #

    def save_file(self, data):
        file_types = ('PDS File (*.pds)', 'All files (*.*)')
        result = self._window.create_file_dialog(
            webview.SAVE_DIALOG,
            directory='',
            save_filename='project.pds',
            file_types=file_types
        )
        if result:
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
        if result:
            filepath = result[0]
            ext = os.path.splitext(filepath)[1].lower()
            if ext == '.pds':
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = json.load(f)
            else:
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
            return {"path": filepath, "content": content}
        return None

    # ---------------- TYPER CONTROL ---------------- #

    def start_typing(self, file_path, data):
        try:
            if typer.is_running():
                return "Already running"
            typer.start_typer(data, self._window)
            return "Started"
        except Exception as e:
            return str(e)

    def stop_typing(self):
        typer.stop_typer()
        return "Stopped"

    def is_running(self):
        """Return True while the typer is active (used by JS to poll for completion)."""
        return typer.is_running()


    def get_settings(self):
        """Return current typing delays for the Settings panel."""
        return typer.get_delays()

    def update_settings(self, typing_delay, loop_delay, sync_delay):
        """Apply new typing speed from the Settings panel."""
        typer.set_delays(typing_delay=typing_delay, loop_delay=loop_delay, sync_delay=sync_delay)
        return 'OK'

    def restore_window(self):
        """Force AutoTyper to become the foreground window on Windows."""
        _force_foreground("AutoTyper")
        if self._window:
            try:
                self._window.restore()
            except Exception:
                pass
        return "Restored"

    def minimize_window(self):
        if self._window:
            try:
                self._window.minimize()
            except Exception:
                pass
        return "Minimized"

    def show_image_fullscreen(self, image_b64):
        """Open a true native fullscreen window over the entire screen."""
        threading.Thread(
            target=_open_fullscreen_image, args=(image_b64,), daemon=True
        ).start()
        return "OK"

    def close_fullscreen_image(self):
        """Close the fullscreen image window if open."""
        _close_fullscreen()
        return "OK"


# ---------------- WINDOWS FOCUS HELPER ---------------- #

def _force_foreground(window_title: str):
    """Bring a window to the foreground using AttachThreadInput trick."""
    try:
        import ctypes
        user32   = ctypes.windll.user32
        kernel32 = ctypes.windll.kernel32

        hwnd = user32.FindWindowW(None, window_title)
        if not hwnd:
            return

        fg_hwnd = user32.GetForegroundWindow()
        fg_tid  = user32.GetWindowThreadProcessId(fg_hwnd, None)
        my_tid  = kernel32.GetCurrentThreadId()

        if fg_tid and fg_tid != my_tid:
            user32.AttachThreadInput(fg_tid, my_tid, True)

        user32.ShowWindow(hwnd, 9)
        user32.BringWindowToTop(hwnd)
        user32.SetForegroundWindow(hwnd)
        user32.SetFocus(hwnd)

        if fg_tid and fg_tid != my_tid:
            user32.AttachThreadInput(fg_tid, my_tid, False)

    except Exception as e:
        print(f"[force_foreground] {e}")


# ---------------- APP ENTRY ---------------- #

if __name__ == '__main__':
    api = Api()

    if getattr(sys, 'frozen', False):
        base_path = sys._MEIPASS
    else:
        base_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    html_path = os.path.join(base_path, 'assets', 'index.html')

    window = webview.create_window(
        'AutoTyper',
        url=f'file:///{html_path.replace(os.sep, "/")}',
        js_api=api,
        width=1000,
        height=700
    )

    api.set_window(window)
    webview.start()