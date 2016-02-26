  'use strict';
  import { ipcRenderer } from 'electron';

  const webview = document.getElementById('webview');
  const popup = document.getElementById('popup');
  const blur = document.getElementById('blur');

  const hidePopup = () => {
    blur.style.visibility = 'hidden';
    popup.style.visibility = 'hidden';
    popup.loadURL('');
  };

  const showPopup = (e) => {
    blur.style.visibility = 'visible';
    popup.style.visibility = 'visible';
    popup.loadURL(e.url);
    popup.focus();
  };

  webview.addEventListener('page-title-updated', (e) => {
    ipcRenderer.send('project-changed', e);
  });

  webview.addEventListener('new-window', (e) => {
    showPopup(e);
  });

  popup.addEventListener('blur', () => {
    hidePopup();
  });

  popup.addEventListener('keydown', (e) => {
    if (e.keyCode === 27) {
      hidePopup();
    }
  });
