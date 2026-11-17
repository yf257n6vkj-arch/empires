// Empires Reloaded as a Mac application: one window that shows the game built into dist/.
const { app, BrowserWindow, Menu, shell } = require("electron");
const path = require("node:path");

// Saved games live in the app's data folder, named after the app. The game was called Empires
// before version 1, so keep that folder and the games saved in it.
app.setPath("userData", path.join(app.getPath("appData"), "Empires"));

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 680,
    title: "Empires Reloaded",
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

// Words of the View menu in the languages of the game; other menus come from macOS.
const VIEW_MENU = {
  cs: ["Zobrazení", "Načíst znovu", "Celá obrazovka"],
  sk: ["Zobrazenie", "Načítať znova", "Celá obrazovka"],
  de: ["Darstellung", "Neu laden", "Vollbild"],
  fr: ["Présentation", "Recharger", "Plein écran"],
  en: ["View", "Reload", "Full screen"],
};

// The standard Mac menu (app, Edit, View, Window) so Cmd+Q, copy and paste and full screen work.
function setMenu() {
  const [view, reload, full] = VIEW_MENU[app.getLocale().slice(0, 2)] ?? VIEW_MENU.en;
  Menu.setApplicationMenu(
    Menu.buildFromTemplate([
      { role: "appMenu" },
      { role: "editMenu" },
      { label: view, submenu: [{ role: "reload", label: reload }, { role: "togglefullscreen", label: full }, { role: "resetZoom" }, { role: "zoomIn" }, { role: "zoomOut" }] },
      { role: "windowMenu" },
    ]),
  );
}

app.whenReady().then(() => {
  setMenu();
  createWindow();
});
app.on("window-all-closed", () => app.quit());
