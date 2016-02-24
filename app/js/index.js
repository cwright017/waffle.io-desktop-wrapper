  'use strict'
  import {ipcRenderer} from 'electron';

  let webview = document.getElementById("webview");
  let popup = document.getElementById("popup");
  let blur = document.getElementById("blur");

  let hidePopup = () => {
    blur.style.visibility = 'hidden';
    popup.style.visibility = 'hidden';
    popup.loadURL("");
  };

  let showPopup = (e) => {
    blur.style.visibility = 'visible';
    popup.style.visibility = 'visible';
    popup.loadURL(e.url);
    popup.focus();
  }

  webview.addEventListener('page-title-updated', (e) => {
    ipcRenderer.send('project-changed', e);
  });

  webview.addEventListener('new-window', (e) => {
    showPopup(e);
  });

  popup.addEventListener('blur', (e) => {
    hidePopup();
  });

  popup.addEventListener('keydown', (e) => {
    if(e.keyCode === 27) {
      hidePopup();
    }
  });
