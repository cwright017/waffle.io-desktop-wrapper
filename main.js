'use strict';
import {electron, ipcMain, app, Menu, MenuItem, Tray, BrowserWindow} from 'electron';
import fetch from 'node-fetch';
const environment = process.env.NODE_ENV || 'production';

let mainWindow;
let appIcon;
let menu;
let projectURL;
let projectName;
let headers;

ipcMain.on('project-changed', (event, data) => {
  clearBadge();
  projectName = data.title;
});

let clearBadge = () => {
  appIcon.setTitle('');
  app.dock.setBadge('');
};

function getPullRequests(projectName) {
  fetch('https://api.waffle.io/' + projectName + '/cards', {headers: headers})
  .then((res) => {
    return res.json()
  })
  .then((json) => {
    return json.filter((item) => item.githubMetadata.pull_request && item.githubMetadata.state === 'open');
  })
  .then((res) => {
    if(res.length > 0) {
      appIcon.setTitle('' + res.length);
      app.dock.setBadge('' + res.length);
    }else{
      clearBadge();
    }
  });
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
    let name = app.getName();
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
  
  const filter = {
    urls: ["https://api.waffle.io/*"]
  };

  mainWindow.webContents.session.webRequest.onBeforeSendHeaders(filter, (details, callback) => {
    if(details.requestHeaders['Authorization']){
      headers = details.requestHeaders;
    }
    callback({cancel: false, requestHeaders: details.requestHeaders});
  })
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
