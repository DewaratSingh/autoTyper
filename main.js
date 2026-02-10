const { app, BrowserWindow, ipcMain, dialog, Menu } = require("electron");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

let pyProcess = null;

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 700,

    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  //Menu.setApplicationMenu(null);
  win.loadFile("index.html");
}

ipcMain.handle("save-file", async (_, data) => {
  console.log(data)
  const { filePath } = await dialog.showSaveDialog({
    filters: [{ name: "PDS File", extensions: ["pds"] }],
  });
  if (!filePath) return null;
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  return filePath;
});

ipcMain.handle("load-file", async () => {
  const { filePaths } = await dialog.showOpenDialog({
    filters: [{ name: "PDS File", extensions: ["pds"] }],
    properties: ["openFile"],
  });
  if (!filePaths.length) return null;
  const content = JSON.parse(fs.readFileSync(filePaths[0]));
  return { path: filePaths[0], content };
});

ipcMain.on("start-typing", (_, filePath, data) => {
  const baseDir = app.isPackaged ? process.resourcesPath : __dirname;
  const temp = path.join(baseDir, "code.json");
  fs.writeFileSync(temp, JSON.stringify(data, null, 2));

  let executable = "python";
  let args = [path.join(__dirname, "typer.py")];
  let cwd = __dirname;

  if (app.isPackaged) {
    const executableName = process.platform === "win32" ? "typer.exe" : "typer";
    executable = path.join(process.resourcesPath, executableName);
    args = [];
    cwd = process.resourcesPath;
  } else if (process.platform === "linux" || process.platform === "darwin") {
    executable = "python3";
  }

  pyProcess = spawn(executable, args, {
    cwd: cwd,
  });

  pyProcess.stdout.on("data", (d) => console.log(d.toString()));
  pyProcess.stderr.on("data", (d) => console.error(d.toString()));
});

ipcMain.on("stop-typing", () => {
  if (pyProcess) {
    pyProcess.kill();
    pyProcess = null;
  }
});

app.whenReady().then(createWindow);
