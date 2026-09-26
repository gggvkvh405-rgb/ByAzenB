const { app, BrowserWindow, WebContentsView, ipcMain, session, Menu, dialog, shell, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');

// ============ ХРАНИЛИЩЕ ДАННЫХ (без внешних зависимостей) ============
class JsonStore {
  constructor(filename, defaults = {}) {
    this.filePath = path.join(app.getPath('userData'), filename);
    this.defaults = defaults;
    this.data = this._load();
  }
  _load() {
    try {
      if (fs.existsSync(this.filePath)) {
        return { ...this.defaults, ...JSON.parse(fs.readFileSync(this.filePath, 'utf-8')) };
      }
    } catch (e) { console.error('Store load error', e); }
    return { ...this.defaults };
  }
  _save() {
    try {
      fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2));
    } catch (e) { console.error('Store save error', e); }
  }
  get(key) { return this.data[key]; }
  set(key, value) { this.data[key] = value; this._save(); }
  getAll() { return this.data; }
}

const historyStore = new JsonStore('history.json', { history: [] });
const bookmarkStore = new JsonStore('bookmarks.json', { bookmarks: [] });
const settingsStore = new JsonStore('settings.json', {
  homepage: 'https://www.google.com',
  searchEngine: 'https://www.google.com/search?q=%s',
  searchEngineName: 'Google',
  darkMode: false,
  incognito: false,
  adBlock: false,
  downloadPath: app.getPath('downloads')
});
const downloadStore = new JsonStore('downloads.json', { downloads: [] });

let mainWindow = null;
let tabs = new Map(); // id -> { view, url, title, favicon, incognito }
let activeTabId = null;
let tabIdCounter = 0;
let isIncognitoWindow = false;

function getActiveView() {
  if (!activeTabId) return null;
  const tab = tabs.get(activeTabId);
  return tab ? tab.view : null;
}

function getSessionForIncognito(isIncognito) {
  if (isIncognito) {
    return session.fromPartition(`incognito-${Date.now()}-${Math.random()}`, { cache: false });
  }
  return session.defaultSession;
}

function createTab(targetUrl, options = {}) {
  const id = ++tabIdCounter;
  const isIncognito = options.incognito || false;
  const ses = isIncognito ? session.fromPartition('incognito', { cache: false }) : session.defaultSession;

  const view = new WebContentsView({
    webPreferences: {
      session: ses,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      // preload не используем для веб-контента в целях безопасности
    }
  });

  // Настройки для блокировки рекламы (простой список) — регистрируем один раз на сессию
  if (settingsStore.get('adBlock') && !ses._adblockRegistered) {
    ses._adblockRegistered = true;
    ses.webRequest.onBeforeRequest((details, callback) => {
      const blockList = ['doubleclick.net', 'googlesyndication', 'adservice.google', 'adsystem', 'adnxs.com'];
      const shouldBlock = blockList.some(d => details.url.includes(d));
      callback({ cancel: shouldBlock });
    });
  }

  // Контекстное меню
  view.webContents.on('context-menu', (event, params) => {
    const menu = Menu.buildFromTemplate([
      { label: 'Назад', enabled: view.webContents.canGoBack(), click: () => view.webContents.goBack() },
      { label: 'Вперед', enabled: view.webContents.canGoForward(), click: () => view.webContents.goForward() },
      { label: 'Перезагрузить', click: () => view.webContents.reload() },
      { type: 'separator' },
      { label: 'Копировать ссылку', enabled: !!params.linkURL, click: () => { require('electron').clipboard.writeText(params.linkURL); } },
      { label: 'Копировать изображение', enabled: params.hasImageContents, click: () => view.webContents.copyImageAt(params.x, params.y) },
      { label: 'Копировать', enabled: params.editFlags.canCopy, role: 'copy' },
      { label: 'Вставить', enabled: params.editFlags.canPaste, role: 'paste' },
      { type: 'separator' },
      { label: 'Инструменты разработчика', click: () => view.webContents.openDevTools() },
      { label: 'Посмотреть исходный код', click: () => view.webContents.viewSource() },
    ]);
    menu.popup();
  });

  // Обновление данных вкладки
  view.webContents.on('page-title-updated', (e, title) => {
    const tab = tabs.get(id);
    if (tab) {
      tab.title = title;
      if (id === activeTabId) mainWindow.webContents.send('tab:updated', { id, title, url: tab.url, favicon: tab.favicon });
      mainWindow.webContents.send('tabs:list', getTabsList());
    }
  });

  view.webContents.on('page-favicon-updated', (e, favicons) => {
    const tab = tabs.get(id);
    if (tab) {
      tab.favicon = favicons[0] || '';
      mainWindow.webContents.send('tabs:list', getTabsList());
      if (id === activeTabId) mainWindow.webContents.send('tab:updated', { id, favicon: tab.favicon });
    }
  });

  view.webContents.on('did-start-loading', () => {
    if (id === activeTabId) mainWindow.webContents.send('nav:loading', { id, loading: true });
  });

  view.webContents.on('did-stop-loading', () => {
    if (id === activeTabId) mainWindow.webContents.send('nav:loading', { id, loading: false });
  });

  view.webContents.on('did-navigate', (e, url) => {
    const tab = tabs.get(id);
    if (tab) {
      tab.url = url;
      if (!isIncognito) addToHistory(url, tab.title || url);
      if (id === activeTabId) mainWindow.webContents.send('tab:updated', { id, url });
      mainWindow.webContents.send('tabs:list', getTabsList());
    }
  });

  view.webContents.on('did-navigate-in-page', (e, url) => {
    const tab = tabs.get(id);
    if (tab) {
      tab.url = url;
      if (id === activeTabId) mainWindow.webContents.send('tab:updated', { id, url });
    }
  });

  view.webContents.on('did-fail-load', (e, code, desc, validatedURL) => {
    if (code === -3) return; // aborted
    console.log(`Failed load ${validatedURL}: ${desc}`);
  });

  // Обработка загрузки файлов
  view.webContents.session.on('will-download', (event, item, webContents) => {
    const downloadPath = settingsStore.get('downloadPath') || app.getPath('downloads');
    const fileName = item.getFilename();
    const savePath = path.join(downloadPath, fileName);
    item.setSavePath(savePath);

    const downloadId = Date.now();
    const downloadItem = {
      id: downloadId,
      filename: fileName,
      url: item.getURL(),
      savePath,
      state: 'progressing',
      received: 0,
      total: item.getTotalBytes(),
      startTime: Date.now()
    };

    const downloads = downloadStore.get('downloads') || [];
    downloads.unshift(downloadItem);
    downloadStore.set('downloads', downloads);
    mainWindow.webContents.send('downloads:updated', downloads);

    item.on('updated', (evt, state) => {
      if (state === 'progressing') {
        downloadItem.received = item.getReceivedBytes();
        mainWindow.webContents.send('download:progress', { id: downloadId, received: downloadItem.received, total: downloadItem.total });
      }
    });

    item.once('done', (evt, state) => {
      downloadItem.state = state;
      downloadItem.received = item.getReceivedBytes();
      const all = downloadStore.get('downloads');
      const idx = all.findIndex(d => d.id === downloadId);
      if (idx !== -1) { all[idx] = downloadItem; downloadStore.set('downloads', all); }
      mainWindow.webContents.send('downloads:updated', all);
      mainWindow.webContents.send('download:done', { id: downloadId, state, savePath });
    });
  });

  // Открытие новых окон - в новой вкладке
  view.webContents.setWindowOpenHandler(({ url }) => {
    createTab(url, { incognito: isIncognito });
    return { action: 'deny' };
  });

  tabs.set(id, {
    id,
    view,
    url: targetUrl,
    title: 'Новая вкладка',
    favicon: '',
    incognito: isIncognito
  });

  if (targetUrl) {
    view.webContents.loadURL(targetUrl).catch(err => {
      console.error('Load error', err);
      view.webContents.loadURL(`data:text/html,<h1>Ошибка загрузки: ${err.message}</h1><p>${targetUrl}</p>`);
    });
  }

  if (!activeTabId) switchTab(id);

  mainWindow.webContents.send('tabs:list', getTabsList());
  return id;
}

function getTabsList() {
  return Array.from(tabs.values()).map(t => ({
    id: t.id,
    url: t.url,
    title: t.title,
    favicon: t.favicon,
    incognito: t.incognito
  }));
}

function switchTab(id) {
  if (!tabs.has(id)) return;
  const prevView = getActiveView();
  if (prevView) {
    mainWindow.contentView.removeChildView(prevView);
  }
  activeTabId = id;
  const tab = tabs.get(id);
  mainWindow.contentView.addChildView(tab.view);
  resizeActiveView();
  tab.view.webContents.focus();
  mainWindow.webContents.send('tab:switched', { id, url: tab.url, title: tab.title });
  mainWindow.webContents.send('tabs:list', getTabsList());
}

function closeTab(id) {
  if (!tabs.has(id)) return;
  const tab = tabs.get(id);
  if (activeTabId === id) {
    mainWindow.contentView.removeChildView(tab.view);
  }
  tab.view.webContents.close();
  tabs.delete(id);

  if (tabs.size === 0) {
    createTab(settingsStore.get('homepage') || 'https://www.google.com');
  } else if (activeTabId === id) {
    const lastId = Array.from(tabs.keys()).pop();
    switchTab(lastId);
  }
  mainWindow.webContents.send('tabs:list', getTabsList());
}

function resizeActiveView() {
  if (!mainWindow || !activeTabId) return;
  const tab = tabs.get(activeTabId);
  if (!tab) return;
  const bounds = mainWindow.getContentBounds();
  const headerHeight = 92; // высота панели вкладок + адресной строки + закладок
  tab.view.setBounds({ x: 0, y: headerHeight, width: bounds.width, height: bounds.height - headerHeight });
}

function addToHistory(url, title) {
  if (!url || url.startsWith('data:') || url.startsWith('about:')) return;
  const history = historyStore.get('history') || [];
  // Не дублировать подряд один и тот же URL
  if (history[0] && history[0].url === url) return;
  history.unshift({ url, title: title || url, timestamp: Date.now(), date: new Date().toISOString() });
  if (history.length > 1000) history.length = 1000;
  historyStore.set('history', history);
}

function resolveInputToUrl(input) {
  input = input.trim();
  if (!input) return settingsStore.get('homepage');
  // Если это уже URL
  if (input.startsWith('http://') || input.startsWith('https://') || input.startsWith('file://') || input.startsWith('about:')) {
    return input;
  }
  // Если содержит точку и нет пробелов - считаем доменом
  if (input.includes('.') && !input.includes(' ') && !input.includes('%')) {
    return 'https://' + input;
  }
  // Иначе поиск
  const searchEngine = settingsStore.get('searchEngine') || 'https://www.google.com/search?q=%s';
  return searchEngine.replace('%s', encodeURIComponent(input));
}

// ============ СОЗДАНИЕ ОКНА ============
function createWindow(opts = {}) {
  const isIncognito = opts.incognito || false;
  isIncognitoWindow = isIncognito;

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: isIncognito ? 'ByAzenB - Инкогнито' : 'ByAzenB Browser',
    backgroundColor: isIncognito ? '#1a1a2e' : '#ffffff',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false // нужно для preload с ipc
    },
    icon: path.join(__dirname, 'assets', 'icon.png'),
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    autoHideMenuBar: true
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  mainWindow.on('resize', resizeActiveView);
  mainWindow.on('maximize', () => setTimeout(resizeActiveView, 100));

  // Первоначальная вкладка
  const homepage = isIncognito ? 'about:blank' : (settingsStore.get('homepage') || 'https://www.google.com');
  createTab(homepage, { incognito: isIncognito });

  // Меню
  const template = [
    {
      label: 'Файл',
      submenu: [
        { label: 'Новая вкладка', accelerator: 'CmdOrCtrl+T', click: () => createTab(settingsStore.get('homepage')) },
        { label: 'Новое инкогнито окно', accelerator: 'CmdOrCtrl+Shift+N', click: () => createWindow({ incognito: true }) },
        { type: 'separator' },
        { label: 'Закрыть вкладку', accelerator: 'CmdOrCtrl+W', click: () => activeTabId && closeTab(activeTabId) },
        { label: 'Выход', accelerator: 'CmdOrCtrl+Q', role: 'quit' }
      ]
    },
    {
      label: 'Правка',
      submenu: [
        { role: 'undo', label: 'Отменить' },
        { role: 'redo', label: 'Повторить' },
        { type: 'separator' },
        { role: 'cut', label: 'Вырезать' },
        { role: 'copy', label: 'Копировать' },
        { role: 'paste', label: 'Вставить' },
        { role: 'selectAll', label: 'Выделить всё' },
        { type: 'separator' },
        { label: 'Найти на странице', accelerator: 'CmdOrCtrl+F', click: () => mainWindow.webContents.send('find:open') }
      ]
    },
    {
      label: 'Вид',
      submenu: [
        { label: 'Перезагрузить', accelerator: 'CmdOrCtrl+R', click: () => getActiveView()?.webContents.reload() },
        { label: 'Принудительно перезагрузить', accelerator: 'CmdOrCtrl+Shift+R', click: () => getActiveView()?.webContents.reloadIgnoringCache() },
        { label: 'Инструменты разработчика', accelerator: 'CmdOrCtrl+Shift+I', click: () => getActiveView()?.webContents.openDevTools() },
        { type: 'separator' },
        { role: 'resetZoom', label: 'Фактический размер' },
        { role: 'zoomIn', label: 'Увеличить' },
        { role: 'zoomOut', label: 'Уменьшить' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Полноэкранный режим' }
      ]
    },
    {
      label: 'История',
      submenu: [
        { label: 'Показать историю', accelerator: 'CmdOrCtrl+H', click: () => mainWindow.webContents.send('page:show', 'history') },
        { label: 'Очистить историю', click: () => { historyStore.set('history', []); mainWindow.webContents.send('history:updated', []); } }
      ]
    },
    {
      label: 'Закладки',
      submenu: [
        { label: 'Добавить закладку', accelerator: 'CmdOrCtrl+D', click: () => mainWindow.webContents.send('bookmark:prompt') },
        { label: 'Показать закладки', click: () => mainWindow.webContents.send('page:show', 'bookmarks') }
      ]
    },
    {
      label: 'Настройки',
      submenu: [
        { label: 'Настройки', accelerator: 'CmdOrCtrl+,', click: () => mainWindow.webContents.send('page:show', 'settings') },
        { label: 'Загрузки', accelerator: 'CmdOrCtrl+J', click: () => mainWindow.webContents.send('page:show', 'downloads') }
      ]
    }
  ];

  if (process.platform === 'darwin') {
    template.unshift({ label: app.name, submenu: [{ role: 'about' }, { type: 'separator' }, { role: 'quit' }] });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  // Горячие клавиши
  globalShortcut.register('CmdOrCtrl+L', () => mainWindow.webContents.send('omnibox:focus'));
}

app.whenReady().then(() => {
  // Протокол для внутренних страниц (совместимость)
  try {
    if (session.defaultSession.protocol.registerFileProtocol) {
      session.defaultSession.protocol.registerFileProtocol('byazenb', (request, callback) => {
        const url = request.url.replace('byazenb://', '');
        const filePath = path.join(__dirname, 'renderer', url);
        callback({ path: filePath });
      });
    }
  } catch (e) {
    console.log('Protocol register skipped:', e.message);
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

// ============ IPC ОБРАБОТЧИКИ ============
ipcMain.handle('tabs:create', (e, url, opts) => {
  const resolved = resolveInputToUrl(url || settingsStore.get('homepage'));
  const id = createTab(resolved, opts);
  switchTab(id);
  return id;
});

ipcMain.handle('tabs:close', (e, id) => closeTab(id));
ipcMain.handle('tabs:switch', (e, id) => switchTab(id));
ipcMain.handle('tabs:list', () => getTabsList());
ipcMain.handle('tabs:duplicate', (e, id) => {
  const tab = tabs.get(id);
  if (tab) {
    const newId = createTab(tab.url, { incognito: tab.incognito });
    switchTab(newId);
    return newId;
  }
});

ipcMain.handle('nav:back', () => getActiveView()?.webContents.goBack());
ipcMain.handle('nav:forward', () => getActiveView()?.webContents.goForward());
ipcMain.handle('nav:reload', () => getActiveView()?.webContents.reload());
ipcMain.handle('nav:stop', () => getActiveView()?.webContents.stop());
ipcMain.handle('nav:home', () => {
  const view = getActiveView();
  if (view) view.webContents.loadURL(settingsStore.get('homepage'));
});
ipcMain.handle('nav:go', (e, input) => {
  const url = resolveInputToUrl(input);
  getActiveView()?.webContents.loadURL(url);
  return url;
});

ipcMain.handle('nav:canGoBack', () => getActiveView()?.webContents.canGoBack() || false);
ipcMain.handle('nav:canGoForward', () => getActiveView()?.webContents.canGoForward() || false);

ipcMain.handle('bookmarks:get', () => bookmarkStore.get('bookmarks') || []);
ipcMain.handle('bookmarks:add', (e, bookmark) => {
  const bookmarks = bookmarkStore.get('bookmarks') || [];
  if (!bookmarks.find(b => b.url === bookmark.url)) {
    bookmarks.push({ ...bookmark, id: Date.now(), added: Date.now() });
    bookmarkStore.set('bookmarks', bookmarks);
  }
  return bookmarks;
});
ipcMain.handle('bookmarks:remove', (e, urlOrId) => {
  let bookmarks = bookmarkStore.get('bookmarks') || [];
  bookmarks = bookmarks.filter(b => b.url !== urlOrId && b.id !== urlOrId);
  bookmarkStore.set('bookmarks', bookmarks);
  return bookmarks;
});
ipcMain.handle('bookmarks:isBookmarked', (e, url) => {
  const bookmarks = bookmarkStore.get('bookmarks') || [];
  return bookmarks.some(b => b.url === url);
});

ipcMain.handle('history:get', () => historyStore.get('history') || []);
ipcMain.handle('history:clear', () => {
  historyStore.set('history', []);
  return [];
});
ipcMain.handle('history:remove', (e, url) => {
  let history = historyStore.get('history') || [];
  history = history.filter(h => h.url !== url);
  historyStore.set('history', history);
  return history;
});
ipcMain.handle('history:search', (e, query) => {
  const history = historyStore.get('history') || [];
  if (!query) return history.slice(0, 100);
  const q = query.toLowerCase();
  return history.filter(h => h.url.toLowerCase().includes(q) || (h.title && h.title.toLowerCase().includes(q))).slice(0, 100);
});

ipcMain.handle('downloads:get', () => downloadStore.get('downloads') || []);
ipcMain.handle('downloads:clear', () => {
  downloadStore.set('downloads', []);
  return [];
});
ipcMain.handle('downloads:openFolder', (e, savePath) => {
  const folder = savePath ? path.dirname(savePath) : (settingsStore.get('downloadPath') || app.getPath('downloads'));
  shell.openPath(folder);
});
ipcMain.handle('downloads:openFile', (e, savePath) => {
  if (savePath && fs.existsSync(savePath)) shell.openPath(savePath);
});

ipcMain.handle('settings:get', () => settingsStore.getAll());
ipcMain.handle('settings:set', (e, key, value) => {
  settingsStore.set(key, value);
  return settingsStore.getAll();
});

ipcMain.handle('window:newIncognito', () => createWindow({ incognito: true }));
ipcMain.handle('window:isIncognito', () => isIncognitoWindow);

ipcMain.handle('find:start', (e, text, options) => {
  const view = getActiveView();
  if (!view) return;
  view.webContents.findInPage(text, options);
});
ipcMain.handle('find:stop', () => {
  const view = getActiveView();
  if (view) view.webContents.stopFindInPage('clearSelection');
});

ipcMain.handle('zoom:get', () => getActiveView()?.webContents.getZoomFactor() || 1);
ipcMain.handle('zoom:set', (e, factor) => getActiveView()?.webContents.setZoomFactor(factor));
ipcMain.handle('zoom:in', () => {
  const view = getActiveView();
  if (view) { const z = view.webContents.getZoomFactor(); view.webContents.setZoomFactor(z + 0.1); return z + 0.1; }
});
ipcMain.handle('zoom:out', () => {
  const view = getActiveView();
  if (view) { const z = view.webContents.getZoomFactor(); view.webContents.setZoomFactor(Math.max(0.25, z - 0.1)); return Math.max(0.25, z - 0.1); }
});
ipcMain.handle('zoom:reset', () => {
  const view = getActiveView();
  if (view) view.webContents.setZoomFactor(1);
  return 1;
});

ipcMain.handle('devtools:open', () => getActiveView()?.webContents.openDevTools());
ipcMain.handle('devtools:close', () => getActiveView()?.webContents.closeDevTools());
ipcMain.handle('devtools:toggle', () => {
  const view = getActiveView();
  if (view) {
    if (view.webContents.isDevToolsOpened()) view.webContents.closeDevTools();
    else view.webContents.openDevTools();
  }
});

ipcMain.handle('dialog:showOpen', async (e, opts) => {
  const result = await dialog.showOpenDialog(mainWindow, opts);
  return result;
});
