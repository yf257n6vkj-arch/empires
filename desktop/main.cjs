// Empires as a Mac application: one window that shows the game built into dist/.
const { app, BrowserWindow, Menu, shell } = require("electron");
const path = require("node:path");

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 680,
    title: "Empires",
    backgroundColor: "#0b0f14",
    webPreferences: { contextIsolation: true, sandbox: true },
  });
  win.loadFile(path.join(__dirname, "game", "index.html"));
  // Links to the outside world (Wikipedia in the encyclopedia) open in the normal browser.
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
  win.webContents.on("will-navigate", (e, url) => {
    if (!url.startsWith("file://")) {
      e.preventDefault();
      shell.openExternal(url);
    }
  });
}

// The standard Mac menu (Empires, Edit, View, Window) so Cmd+Q, copy and paste and full screen work.
Menu.setApplicationMenu(
  Menu.buildFromTemplate([
    { role: "appMenu" },
    { role: "editMenu" },
    { label: "Zobrazení", submenu: [{ role: "reload", label: "Načíst znovu" }, { role: "togglefullscreen", label: "Celá obrazovka" }, { role: "resetZoom" }, { role: "zoomIn" }, { role: "zoomOut" }] },
    { role: "windowMenu" },
  ]),
);

app.whenReady().then(createWindow);
app.on("window-all-closed", () => app.quit());
