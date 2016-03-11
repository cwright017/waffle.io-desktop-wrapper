'use strict';
import { ipcMain, app, Menu, Tray, BrowserWindow, globalShortcut } from 'electron';
import fetch from 'node-fetch';
const environment = process.env.NODE_ENV || 'production';

let mainWindow;
let appIcon;
let projectName;
let headers;
let currentPage;

function clearBadge() {
  appIcon.setTitle('');
  app.dock.setBadge('');
}

function focusWindow() {
  mainWindow.focus();
}

function hideWindow() {
  mainWindow.hide();
  appIcon.setImage(`${__dirname}/images/hidden.png`);
}

function showWindow() {
  if (mainWindow === null) {
    createWindow();
  } else {
    mainWindow.show();
    mainWindow.focus();
    appIcon.setImage(`${__dirname}/images/visible.png`);
  }
}

function getPullRequests() {
  fetch(`https://api.waffle.io/${projectName}/cards`, { headers })
  .then((res) => res.json())
  .then((json) =>
    json.filter((item) => item.githubMetadata.pull_request && item.githubMetadata.state === 'open'))
  .then((res) => {
    if (res.length > 0) {
      appIcon.setTitle(res.length.toString());
      app.dock.setBadge(res.length.toString());
    } else {
      clearBadge();
    }
  });
}

function toggleMainWindow() {
  if (mainWindow && mainWindow.isVisible()) {
    if (mainWindow.isFocused()) {
      hideWindow();
    } else {
      focusWindow();
    }
  } else {
    showWindow();
  }
}

function createTray() {
  appIcon = new Tray(`${__dirname}/images/visible.png`);

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Hide Window', click: () => hideWindow() },
  ]);

  appIcon.setToolTip('Waffle.io');
  appIcon.on('click', () => {
    toggleMainWindow();
  });

  appIcon.on('right-click', () => {
    appIcon.popUpContextMenu(contextMenu);
  });
}

function registerHotkey(item) {
  if (item && item.checked) {
    globalShortcut.register('alt+w', () => {
      toggleMainWindow();
    });
  } else {
    globalShortcut.unregisterAll();
  }
}

function createMenu() {
  const template = [
    {
      label: 'Edit',
      submenu: [
        {
          label: 'Undo',
          accelerator: 'CmdOrCtrl+Z',
          role: 'undo',
        },
        {
          label: 'Redo',
          accelerator: 'Shift+CmdOrCtrl+Z',
          role: 'redo',
        },
        {
          type: 'separator',
        },
        {
          label: 'Cut',
          accelerator: 'CmdOrCtrl+X',
          role: 'cut',
        },
        {
          label: 'Copy',
          accelerator: 'CmdOrCtrl+C',
          role: 'copy',
        },
        {
          label: 'Paste',
          accelerator: 'CmdOrCtrl+V',
          role: 'paste',
        },
        {
          label: 'Select All',
          accelerator: 'CmdOrCtrl+A',
          role: 'selectall',
        },
      ],
    },
  ];

  if (process.platform === 'darwin') {
    const name = app.getName();
    template.unshift({
      label: name,
      submenu: [
        {
          label: `About ${name}`,
          role: 'about',
        },
        {
          type: 'separator',
        },
        {
          label: 'Reload',
          accelerator: 'cmd+r',
          click: () => mainWindow.webContents.send('refresh'),
        },
        {
          label: 'Toggle window',
          accelerator: 'alt+w',
          click: () => toggleMainWindow(),
        },
        {
          label: 'Set toggle shortcut globally',
          type: 'checkbox',
          checked: true,
          click: (item) => registerHotkey(item),
        },
        {
          type: 'separator',
        },
        {
          label: 'Services',
          role: 'services',
          submenu: [],
        },
        {
          type: 'separator',
        },
        {
          label: `Hide ${name}`,
          accelerator: 'Command+H',
          role: 'hide',
        },
        {
          label: 'Hide Others',
          accelerator: 'Command+Alt+H',
          role: 'hideothers',
        },
        {
          label: 'Show All',
          role: 'unhide',
        },
        {
          type: 'separator',
        },
        {
          label: 'Quit',
          accelerator: 'Command+Q',
          click: () => app.quit(),
        },
      ],
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function addDevTools() {
  if (environment === 'development') {
    mainWindow.webContents.openDevTools();
  }
}

function pollForPullRequests() {
  const timer = setInterval(() => {
    if (projectName) {
      getPullRequests();
    }
  }, 5000);

  return timer;
}

function getRequestHeaders() {
  const filter = {
    urls: ['https://api.waffle.io/*'],
  };

  mainWindow.webContents.session.webRequest.onBeforeSendHeaders(filter, (details, callback) => {
    if (details.requestHeaders.Authorization) {
      headers = details.requestHeaders;
    }
    callback({ cancel: false, requestHeaders: details.requestHeaders });
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({ width: 800, height: 600, alwaysOnTop: false });
  mainWindow.loadURL(`file://${__dirname}/app/index.html`);
  mainWindow.maximize();
  appIcon.setImage(`${__dirname}/images/visible.png`);

  mainWindow.webContents.on('dom-ready', () => {
    if (currentPage && currentPage !== "") {
      mainWindow.webContents.send('load-page', currentPage);
    }
  });

  mainWindow.on('closed', () => {
    appIcon.setImage(`${__dirname}/images/hidden.png`);
    mainWindow = null;
  });

  addDevTools();
}

function startWindowRefreshTimer() {
  setInterval(() => {
    if (!mainWindow.isFocused()) {
      mainWindow.webContents.send('refresh');
    }
  }, 600000);
}

function init() {
  createTray();
  createWindow();
  createMenu();
  registerHotkey();
  addDevTools();
  startWindowRefreshTimer();

  getRequestHeaders();
  pollForPullRequests();
}

app.on('ready', init);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  } else {
    showWindow();
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

ipcMain.on('did-navigate', (event, data) => {
  currentPage = data.url;
});

ipcMain.on('project-changed', (event, data) => {
  clearBadge();
  projectName = data.title;
});
