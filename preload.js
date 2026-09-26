const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('byazenb', {
  // Tabs
  createTab: (url, opts) => ipcRenderer.invoke('tabs:create', url, opts),
  closeTab: (id) => ipcRenderer.invoke('tabs:close', id),
  switchTab: (id) => ipcRenderer.invoke('tabs:switch', id),
  listTabs: () => ipcRenderer.invoke('tabs:list'),
  duplicateTab: (id) => ipcRenderer.invoke('tabs:duplicate', id),

  // Navigation
  goBack: () => ipcRenderer.invoke('nav:back'),
  goForward: () => ipcRenderer.invoke('nav:forward'),
  reload: () => ipcRenderer.invoke('nav:reload'),
  stop: () => ipcRenderer.invoke('nav:stop'),
  goHome: () => ipcRenderer.invoke('nav:home'),
  navigate: (input) => ipcRenderer.invoke('nav:go', input),
  canGoBack: () => ipcRenderer.invoke('nav:canGoBack'),
  canGoForward: () => ipcRenderer.invoke('nav:canGoForward'),

  // Bookmarks
  getBookmarks: () => ipcRenderer.invoke('bookmarks:get'),
  addBookmark: (bm) => ipcRenderer.invoke('bookmarks:add', bm),
  removeBookmark: (idOrUrl) => ipcRenderer.invoke('bookmarks:remove', idOrUrl),
  isBookmarked: (url) => ipcRenderer.invoke('bookmarks:isBookmarked', url),

  // History
  getHistory: () => ipcRenderer.invoke('history:get'),
  clearHistory: () => ipcRenderer.invoke('history:clear'),
  removeHistory: (url) => ipcRenderer.invoke('history:remove', url),
  searchHistory: (q) => ipcRenderer.invoke('history:search', q),

  // Downloads
  getDownloads: () => ipcRenderer.invoke('downloads:get'),
  clearDownloads: () => ipcRenderer.invoke('downloads:clear'),
  openDownloadFolder: (p) => ipcRenderer.invoke('downloads:openFolder', p),
  openDownloadFile: (p) => ipcRenderer.invoke('downloads:openFile', p),

  // Settings
  getSettings: () => ipcRenderer.invoke('settings:get'),
  setSetting: (k, v) => ipcRenderer.invoke('settings:set', k, v),

  // Window
  newIncognito: () => ipcRenderer.invoke('window:newIncognito'),
  isIncognito: () => ipcRenderer.invoke('window:isIncognito'),

  // Find
  findStart: (text, opts) => ipcRenderer.invoke('find:start', text, opts),
  findStop: () => ipcRenderer.invoke('find:stop'),

  // Zoom
  getZoom: () => ipcRenderer.invoke('zoom:get'),
  setZoom: (f) => ipcRenderer.invoke('zoom:set', f),
  zoomIn: () => ipcRenderer.invoke('zoom:in'),
  zoomOut: () => ipcRenderer.invoke('zoom:out'),
  zoomReset: () => ipcRenderer.invoke('zoom:reset'),

  // DevTools
  openDevTools: () => ipcRenderer.invoke('devtools:open'),
  closeDevTools: () => ipcRenderer.invoke('devtools:close'),
  toggleDevTools: () => ipcRenderer.invoke('devtools:toggle'),

  // Dialog
  showOpenDialog: (opts) => ipcRenderer.invoke('dialog:showOpen', opts),

  // Events from main
  onTabsList: (cb) => ipcRenderer.on('tabs:list', (e, data) => cb(data)),
  onTabSwitched: (cb) => ipcRenderer.on('tab:switched', (e, data) => cb(data)),
  onTabUpdated: (cb) => ipcRenderer.on('tab:updated', (e, data) => cb(data)),
  onNavLoading: (cb) => ipcRenderer.on('nav:loading', (e, data) => cb(data)),
  onShowPage: (cb) => ipcRenderer.on('page:show', (e, page) => cb(page)),
  onHistoryUpdated: (cb) => ipcRenderer.on('history:updated', (e, data) => cb(data)),
  onDownloadsUpdated: (cb) => ipcRenderer.on('downloads:updated', (e, data) => cb(data)),
  onDownloadProgress: (cb) => ipcRenderer.on('download:progress', (e, data) => cb(data)),
  onDownloadDone: (cb) => ipcRenderer.on('download:done', (e, data) => cb(data)),
  onFindOpen: (cb) => ipcRenderer.on('find:open', () => cb()),
  onBookmarkPrompt: (cb) => ipcRenderer.on('bookmark:prompt', () => cb()),

  // For removing listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});
