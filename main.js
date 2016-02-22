'use strict';

const electron = require('electron');
const ipcMain = require('electron').ipcMain;
const fetch = require('node-fetch');
const app = electron.app;
const Menu = electron.Menu;
const MenuItem = electron.MenuItem;
const Tray = electron.Tray;
const BrowserWindow = electron.BrowserWindow;
const environment = process.env.NODE_ENV || 'production';

let mainWindow;
let appIcon;
let menu;
let projectURL;
let projectName;

ipcMain.on('project-updated', (event, data) => {
  projectURL = data.newURL;
  projectName = data.newURL.split('https://api.waffle.io/projects/',2)[1];
});

function getPullRequests(projectName) {
  fetch('https://api.waffle.io/'+ projectName + '/cards')
  .then((res) => {
    return res.json()
  })
  .then((json) => {
    return json.filter((item) => item.githubMetadata.pull_request && item.githubMetadata.state === 'open');
  })
  .then((res) => {
    appIcon.setTitle('' + res.length);
    app.dock.setBadge('' + res.length);
  })
}

function createWindow () {
  mainWindow = new BrowserWindow({width: 800, height: 600, alwaysOnTop: false, frame: false});
  mainWindow.loadURL('file://' + __dirname + '/app/index.html');
  mainWindow.maximize();
  mainWindow.setResizable(false);

  appIcon = new Tray(__dirname + '/images/visible.png');

  setInterval(() => {
    if(projectName) {
      getPullRequests(projectName);
    }
  },5000)

  let template = [
    {
      label: 'Edit',
      submenu: [
        {
          label: 'Undo',
          accelerator: 'CmdOrCtrl+Z',
          role: 'undo'
        },
        {
          label: 'Redo',
          accelerator: 'Shift+CmdOrCtrl+Z',
          role: 'redo'
        },
        {
          type: 'separator'
        },
        {
          label: 'Cut',
          accelerator: 'CmdOrCtrl+X',
          role: 'cut'
        },
        {
          label: 'Copy',
          accelerator: 'CmdOrCtrl+C',
          role: 'copy'
        },
        {
          label: 'Paste',
          accelerator: 'CmdOrCtrl+V',
          role: 'paste'
        },
        {
          label: 'Select All',
          accelerator: 'CmdOrCtrl+A',
          role: 'selectall'
        },
      ]
    }
  ];

  if (process.platform == 'darwin') {
    let name = require('electron').app.getName();
    template.unshift({
      label: name,
      submenu: [
        {
          label: 'About ' + name,
          role: 'about'
        },
        {
          type: 'separator'
        },
        {
          label: 'Services',
          role: 'services',
          submenu: []
        },
        {
          type: 'separator'
        },
        {
          label: 'Hide ' + name,
          accelerator: 'Command+H',
          role: 'hide'
        },
        {
          label: 'Hide Others',
          accelerator: 'Command+Alt+H',
          role: 'hideothers'
        },
        {
          label: 'Show All',
          role: 'unhide'
        },
        {
          type: 'separator'
        },
        {
          label: 'Quit',
          accelerator: 'Command+Q',
          click: () => app.quit()
        },
      ]
    });
  }

  let menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  appIcon.setToolTip('Waffle.io');
  appIcon.on('click', () => {
    mainWindow.isVisible() ? hideWindow() : showWindow()
  })

  mainWindow.on('blur', () => {
    hideWindow();
  });

  let hideWindow = () => {
    mainWindow.hide()
    appIcon.setImage(__dirname + '/images/hidden.png');
  };

  let showWindow = () => {
    mainWindow.show()
    appIcon.setImage(__dirname + '/images/visible.png');
  };

  if(environment === 'development') {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
