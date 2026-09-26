let currentTabs = [];
let activeTabId = null;
let currentUrl = '';
let isLoading = false;
let bookmarks = [];
let settings = {};
let isIncognito = false;

const els = {
  tabsContainer: document.getElementById('tabs-container'),
  newTabBtn: document.getElementById('new-tab-btn'),
  backBtn: document.getElementById('back-btn'),
  forwardBtn: document.getElementById('forward-btn'),
  reloadBtn: document.getElementById('reload-btn'),
  homeBtn: document.getElementById('home-btn'),
  omnibox: document.getElementById('omnibox'),
  bookmarkStar: document.getElementById('bookmark-star'),
  securityIcon: document.getElementById('security-icon'),
  bookmarksBar: document.getElementById('bookmarks-bar'),
  progressBar: document.getElementById('progress-bar'),
  progressFill: document.getElementById('progress-fill'),
  internalPages: document.getElementById('internal-pages'),
  newtabSearchInput: document.getElementById('newtab-search-input'),
  newtabSearchBtn: document.getElementById('newtab-search-btn'),
  newtabShortcuts: document.getElementById('newtab-shortcuts-grid'),
  historyList: document.getElementById('history-list'),
  historySearch: document.getElementById('history-search'),
  historyClear: document.getElementById('history-clear'),
  bookmarksList: document.getElementById('bookmarks-list'),
  downloadsList: document.getElementById('downloads-list'),
  downloadsClear: document.getElementById('downloads-clear'),
  downloadsOpenFolder: document.getElementById('downloads-open-folder'),
  settingHomepage: document.getElementById('setting-homepage'),
  settingSearchEngine: document.getElementById('setting-search-engine'),
  settingDownloadPath: document.getElementById('setting-download-path'),
  settingBrowseDownload: document.getElementById('setting-browse-download'),
  settingDarkMode: document.getElementById('setting-dark-mode'),
  settingAdBlock: document.getElementById('setting-adblock'),
  btnClearHistory: document.getElementById('btn-clear-history'),
  btnNewIncognito: document.getElementById('btn-new-incognito'),
  findBar: document.getElementById('find-bar'),
  findInput: document.getElementById('find-input'),
  findPrev: document.getElementById('find-prev'),
  findNext: document.getElementById('find-next'),
  findClose: document.getElementById('find-close'),
  findCount: document.getElementById('find-count'),
  browserMenu: document.getElementById('browser-menu'),
  menuBtn: document.getElementById('menu-btn'),
  downloadsBtn: document.getElementById('downloads-btn'),
  historyBtn: document.getElementById('history-btn'),
  bookmarksBtn: document.getElementById('bookmarks-btn'),
  incognitoBadge: document.getElementById('incognito-badge'),
  app: document.getElementById('app')
};

function showPage(pageId) {
  document.querySelectorAll('.internal-page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById(`page-${pageId}`);
  if (target) target.classList.add('active');
  if (pageId === 'newtab') {
    // hide internal pages overlay to show webview? For newtab we show our page
    // But webview is still behind? We keep it - newtab is internal, so we need to hide webview? Actually main.js always shows view. For internal pages we should keep view hidden by showing overlay.
    // Our CSS makes internal pages overlay - active page covers. For newtab we also cover.
  }
  // If showing newtab/history/etc, we are overlaying the webContentsView, but view still exists underneath.
}

function hideAllInternalPages() {
  document.querySelectorAll('.internal-page').forEach(p => p.classList.remove('active'));
}

function isInternalPageVisible() {
  return !!document.querySelector('.internal-page.active');
}

// Tabs rendering
function renderTabs() {
  els.tabsContainer.innerHTML = '';
  currentTabs.forEach(tab => {
    const tabEl = document.createElement('div');
    tabEl.className = `tab ${tab.id === activeTabId ? 'active' : ''} ${tab.incognito ? 'incognito' : ''}`;
    tabEl.dataset.id = tab.id;
    
    const favicon = tab.favicon ? `<img class="tab-favicon" src="${tab.favicon}" onerror="this.style.display='none'">` : '<span class="tab-favicon">🌐</span>';
    tabEl.innerHTML = `
      ${favicon}
      <span class="tab-title" title="${escapeHtml(tab.title || 'Новая вкладка')}">${escapeHtml(tab.title || 'Новая вкладка')}</span>
      <button class="tab-close" title="Закрыть">✕</button>
    `;
    tabEl.addEventListener('click', (e) => {
      if (!e.target.classList.contains('tab-close')) {
        window.byazenb.switchTab(tab.id);
      }
    });
    tabEl.querySelector('.tab-close').addEventListener('click', (e) => {
      e.stopPropagation();
      window.byazenb.closeTab(tab.id);
    });
    tabEl.addEventListener('auxclick', (e) => {
      if (e.button === 1) window.byazenb.closeTab(tab.id);
    });
    els.tabsContainer.appendChild(tabEl);
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function updateNavButtons() {
  window.byazenb.canGoBack().then(can => els.backBtn.disabled = !can);
  window.byazenb.canGoForward().then(can => els.forwardBtn.disabled = !can);
  els.reloadBtn.textContent = isLoading ? '✕' : '↻';
  els.reloadBtn.title = isLoading ? 'Остановить' : 'Обновить';
}

function updateSecurityIcon(url) {
  if (!url) return;
  if (url.startsWith('https://')) {
    els.securityIcon.textContent = '🔒';
    els.securityIcon.title = 'Соединение защищено';
  } else if (url.startsWith('http://')) {
    els.securityIcon.textContent = '⚠️';
    els.securityIcon.title = 'Небезопасное соединение';
  } else if (url.startsWith('byazenb://') || url.startsWith('about:') || url.startsWith('data:')) {
    els.securityIcon.textContent = '🔧';
    els.securityIcon.title = 'Внутренняя страница';
  } else {
    els.securityIcon.textContent = '🌐';
  }
}

function updateBookmarkStar(url) {
  if (!url) return;
  window.byazenb.isBookmarked(url).then(isBm => {
    els.bookmarkStar.textContent = isBm ? '★' : '☆';
    els.bookmarkStar.classList.toggle('bookmarked', isBm);
  });
}

function renderBookmarksBar() {
  els.bookmarksBar.innerHTML = '';
  bookmarks.slice(0, 20).forEach(bm => {
    const btn = document.createElement('button');
    btn.className = 'bookmark-item';
    btn.innerHTML = `<span>⭐</span><span>${escapeHtml(bm.title || bm.url)}</span>`;
    btn.title = bm.url;
    btn.addEventListener('click', () => window.byazenb.navigate(bm.url));
    btn.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      if (confirm(`Удалить закладку "${bm.title}"?`)) {
        window.byazenb.removeBookmark(bm.url).then(updated => {
          bookmarks = updated;
          renderBookmarksBar();
          renderBookmarksPage();
        });
      }
    });
    els.bookmarksBar.appendChild(btn);
  });
}

function renderHistoryPage(items) {
  els.historyList.innerHTML = '';
  if (!items || items.length === 0) {
    els.historyList.innerHTML = '<p style="padding:20px;color:var(--text-secondary)">История пуста</p>';
    return;
  }
  // Группировка по дате
  const groups = {};
  items.forEach(item => {
    const date = new Date(item.timestamp).toLocaleDateString();
    if (!groups[date]) groups[date] = [];
    groups[date].push(item);
  });

  Object.entries(groups).forEach(([date, entries]) => {
    const header = document.createElement('h4');
    header.textContent = date;
    header.style.padding = '12px 0 6px';
    header.style.color = 'var(--text-secondary)';
    header.style.fontWeight = '400';
    els.historyList.appendChild(header);
    entries.forEach(item => {
      const div = document.createElement('div');
      div.className = 'history-item';
      div.innerHTML = `
        <span class="favicon">🌐</span>
        <div class="info">
          <div class="title">${escapeHtml(item.title || item.url)}</div>
          <div class="url">${escapeHtml(item.url)}</div>
        </div>
        <div class="time">${new Date(item.timestamp).toLocaleTimeString()}</div>
        <div class="item-actions">
          <button class="danger" data-action="remove">Удалить</button>
        </div>
      `;
      div.addEventListener('click', (e) => {
        if (e.target.dataset.action === 'remove') {
          window.byazenb.removeHistory(item.url).then(updated => renderHistoryPage(updated));
        } else {
          window.byazenb.navigate(item.url);
          hideAllInternalPages();
        }
      });
      els.historyList.appendChild(div);
    });
  });
}

function renderBookmarksPage() {
  els.bookmarksList.innerHTML = '';
  if (bookmarks.length === 0) {
    els.bookmarksList.innerHTML = '<p style="padding:20px;color:var(--text-secondary)">Закладок нет. Нажмите ☆ в адресной строке чтобы добавить.</p>';
    return;
  }
  bookmarks.forEach(bm => {
    const div = document.createElement('div');
    div.className = 'bookmark-list-item';
    div.innerHTML = `
      <span class="favicon">⭐</span>
      <div class="info">
        <div class="title">${escapeHtml(bm.title || bm.url)}</div>
        <div class="url">${escapeHtml(bm.url)}</div>
      </div>
      <div class="item-actions">
        <button data-action="open">Открыть</button>
        <button class="danger" data-action="remove">Удалить</button>
      </div>
    `;
    div.querySelector('[data-action="open"]').addEventListener('click', () => {
      window.byazenb.navigate(bm.url);
      hideAllInternalPages();
    });
    div.querySelector('[data-action="remove"]').addEventListener('click', () => {
      window.byazenb.removeBookmark(bm.url).then(updated => {
        bookmarks = updated;
        renderBookmarksPage();
        renderBookmarksBar();
      });
    });
    els.bookmarksList.appendChild(div);
  });
}

function renderDownloadsPage(downloads) {
  els.downloadsList.innerHTML = '';
  if (!downloads || downloads.length === 0) {
    els.downloadsList.innerHTML = '<p style="padding:20px;color:var(--text-secondary)">Загрузок нет</p>';
    return;
  }
  downloads.forEach(dl => {
    const div = document.createElement('div');
    div.className = 'download-item';
    const progress = dl.total > 0 ? Math.round((dl.received / dl.total) * 100) : 0;
    const stateText = dl.state === 'progressing' ? `${progress}%` : dl.state === 'completed' ? 'Завершено' : dl.state;
    div.innerHTML = `
      <span class="favicon">📄</span>
      <div class="info">
        <div class="filename">${escapeHtml(dl.filename)} — ${stateText}</div>
        <div class="url">${escapeHtml(dl.savePath || dl.url)}</div>
      </div>
      <div class="item-actions">
        <button data-action="open">Открыть</button>
        <button data-action="folder">Папка</button>
      </div>
    `;
    div.querySelector('[data-action="open"]').addEventListener('click', () => window.byazenb.openDownloadFile(dl.savePath));
    div.querySelector('[data-action="folder"]').addEventListener('click', () => window.byazenb.openDownloadFolder(dl.savePath));
    els.downloadsList.appendChild(div);
  });
}

function renderNewTabShortcuts() {
  els.newtabShortcuts.innerHTML = '';
  const defaults = [
    { title: 'Google', url: 'https://google.com', icon: '🔍' },
    { title: 'YouTube', url: 'https://youtube.com', icon: '▶️' },
    { title: 'GitHub', url: 'https://github.com', icon: '🐙' },
    { title: 'Wikipedia', url: 'https://wikipedia.org', icon: '📚' },
    { title: 'StackOverflow', url: 'https://stackoverflow.com', icon: '💻' },
    { title: 'Habr', url: 'https://habr.com', icon: '📰' },
  ];
  const items = [...bookmarks.slice(0, 6), ...defaults].slice(0, 8);
  items.forEach(item => {
    const card = document.createElement('div');
    card.className = 'shortcut-card';
    card.innerHTML = `<div class="icon">${item.icon || '🌐'}</div><div class="label">${escapeHtml(item.title || item.url)}</div>`;
    card.title = item.url;
    card.addEventListener('click', () => window.byazenb.navigate(item.url));
    els.newtabShortcuts.appendChild(card);
  });
}

// События UI
els.newTabBtn.addEventListener('click', () => window.byazenb.createTab(settings.homepage));
els.backBtn.addEventListener('click', () => window.byazenb.goBack());
els.forwardBtn.addEventListener('click', () => window.byazenb.goForward());
els.reloadBtn.addEventListener('click', () => {
  if (isLoading) window.byazenb.stop();
  else window.byazenb.reload();
});
els.homeBtn.addEventListener('click', () => window.byazenb.goHome());

els.omnibox.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const val = els.omnibox.value.trim();
    if (val) {
      window.byazenb.navigate(val).then(() => hideAllInternalPages());
    }
  }
  if (e.key === 'Escape') {
    els.omnibox.blur();
    if (activeTabId) {
      const tab = currentTabs.find(t => t.id === activeTabId);
      if (tab) els.omnibox.value = tab.url;
    }
  }
});

els.omnibox.addEventListener('focus', () => els.omnibox.select());

els.bookmarkStar.addEventListener('click', async () => {
  if (!currentUrl) return;
  const isBm = await window.byazenb.isBookmarked(currentUrl);
  if (isBm) {
    bookmarks = await window.byazenb.removeBookmark(currentUrl);
  } else {
    const tab = currentTabs.find(t => t.id === activeTabId);
    bookmarks = await window.byazenb.addBookmark({ url: currentUrl, title: tab ? tab.title : currentUrl });
  }
  renderBookmarksBar();
  updateBookmarkStar(currentUrl);
});

els.newtabSearchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const val = els.newtabSearchInput.value.trim();
    if (val) window.byazenb.navigate(val).then(() => hideAllInternalPages());
  }
});
els.newtabSearchBtn.addEventListener('click', () => {
  const val = els.newtabSearchInput.value.trim();
  if (val) window.byazenb.navigate(val).then(() => hideAllInternalPages());
});

// History page
els.historySearch.addEventListener('input', async (e) => {
  const q = e.target.value.trim();
  const results = await window.byazenb.searchHistory(q);
  renderHistoryPage(results);
});
els.historyClear.addEventListener('click', async () => {
  if (confirm('Очистить всю историю?')) {
    const cleared = await window.byazenb.clearHistory();
    renderHistoryPage(cleared);
  }
});

// Downloads
els.downloadsClear.addEventListener('click', async () => {
  const cleared = await window.byazenb.clearDownloads();
  renderDownloadsPage(cleared);
});
els.downloadsOpenFolder.addEventListener('click', () => window.byazenb.openDownloadFolder());

// Settings
els.settingHomepage.addEventListener('change', (e) => window.byazenb.setSetting('homepage', e.target.value));
els.settingSearchEngine.addEventListener('change', (e) => {
  window.byazenb.setSetting('searchEngine', e.target.value);
  const name = e.target.options[e.target.selectedIndex].text;
  window.byazenb.setSetting('searchEngineName', name);
});
els.settingDarkMode.addEventListener('change', (e) => {
  const dark = e.target.checked;
  window.byazenb.setSetting('darkMode', dark);
  els.app.classList.toggle('theme-dark', dark);
  els.app.classList.toggle('theme-light', !dark);
});
els.settingAdBlock.addEventListener('change', (e) => window.byazenb.setSetting('adBlock', e.target.checked));
els.settingBrowseDownload.addEventListener('click', async () => {
  const res = await window.byazenb.showOpenDialog({ properties: ['openDirectory'] });
  if (!res.canceled && res.filePaths[0]) {
    els.settingDownloadPath.value = res.filePaths[0];
    window.byazenb.setSetting('downloadPath', res.filePaths[0]);
  }
});
els.btnClearHistory.addEventListener('click', async () => {
  if (confirm('Очистить историю?')) {
    const cleared = await window.byazenb.clearHistory();
    renderHistoryPage(cleared);
  }
});
els.btnNewIncognito.addEventListener('click', () => window.byazenb.newIncognito());

// Find bar
els.findInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    window.byazenb.findStart(els.findInput.value, { forward: !e.shiftKey });
  }
  if (e.key === 'Escape') closeFindBar();
});
els.findPrev.addEventListener('click', () => window.byazenb.findStart(els.findInput.value, { forward: false }));
els.findNext.addEventListener('click', () => window.byazenb.findStart(els.findInput.value, { forward: true }));
els.findClose.addEventListener('click', closeFindBar);
function openFindBar() {
  els.findBar.classList.remove('hidden');
  els.findInput.focus();
  els.findInput.select();
}
function closeFindBar() {
  els.findBar.classList.add('hidden');
  window.byazenb.findStop();
}

// Menu
els.menuBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  els.browserMenu.classList.toggle('hidden');
});
document.addEventListener('click', (e) => {
  if (!els.browserMenu.contains(e.target) && e.target !== els.menuBtn) {
    els.browserMenu.classList.add('hidden');
  }
});
els.browserMenu.addEventListener('click', (e) => {
  const item = e.target.closest('.menu-item');
  if (!item) return;
  const action = item.dataset.action;
  els.browserMenu.classList.add('hidden');
  handleMenuAction(action);
});

function handleMenuAction(action) {
  switch (action) {
    case 'new-tab': window.byazenb.createTab(settings.homepage); break;
    case 'new-incognito': window.byazenb.newIncognito(); break;
    case 'history': showPage('history'); window.byazenb.getHistory().then(renderHistoryPage); break;
    case 'downloads': showPage('downloads'); window.byazenb.getDownloads().then(renderDownloadsPage); break;
    case 'bookmarks': showPage('bookmarks'); renderBookmarksPage(); break;
    case 'find': openFindBar(); break;
    case 'devtools': window.byazenb.toggleDevTools(); break;
    case 'zoom-in': window.byazenb.zoomIn(); break;
    case 'zoom-out': window.byazenb.zoomOut(); break;
    case 'zoom-reset': window.byazenb.zoomReset(); break;
    case 'settings': showPage('settings'); break;
  }
}

els.downloadsBtn.addEventListener('click', () => { showPage('downloads'); window.byazenb.getDownloads().then(renderDownloadsPage); });
els.historyBtn.addEventListener('click', () => { showPage('history'); window.byazenb.getHistory().then(renderHistoryPage); });
els.bookmarksBtn.addEventListener('click', () => { showPage('bookmarks'); renderBookmarksPage(); });

document.querySelectorAll('.close-page-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const page = btn.dataset.page;
    if (page === 'newtab') {
      hideAllInternalPages();
    } else {
      document.getElementById(`page-${page}`).classList.remove('active');
      // если больше нет активных внутренних страниц, скрываем оверлей
      if (!isInternalPageVisible()) hideAllInternalPages();
    }
  });
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 't') {
    e.preventDefault();
    window.byazenb.createTab(settings.homepage);
  }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'w') {
    e.preventDefault();
    if (activeTabId) window.byazenb.closeTab(activeTabId);
  }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'l') {
    e.preventDefault();
    els.omnibox.focus();
    els.omnibox.select();
  }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'r') {
    e.preventDefault();
    window.byazenb.reload();
  }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'h') {
    e.preventDefault();
    showPage('history');
    window.byazenb.getHistory().then(renderHistoryPage);
  }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'j') {
    e.preventDefault();
    showPage('downloads');
    window.byazenb.getDownloads().then(renderDownloadsPage);
  }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
    e.preventDefault();
    els.bookmarkStar.click();
  }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
    e.preventDefault();
    openFindBar();
  }
  if (e.key === 'Escape' && !els.findBar.classList.contains('hidden')) {
    closeFindBar();
  }
});

// IPC listeners
window.byazenb.onTabsList((tabs) => {
  currentTabs = tabs;
  renderTabs();
});

window.byazenb.onTabSwitched(({ id, url }) => {
  activeTabId = id;
  currentUrl = url || '';
  if (currentUrl) {
    els.omnibox.value = currentUrl;
    updateSecurityIcon(currentUrl);
    updateBookmarkStar(currentUrl);
  }
  renderTabs();
  updateNavButtons();
  // Если мы на внутренней странице newtab и переключаемся - скрываем newtab если url не newtab?
  // Оставляем логику: если URL есть, скрываем внутренние страницы кроме случаев когда это наша newtab страница?
  // Для простоты: при переключении вкладки всегда скрываем внутренние страницы
  hideAllInternalPages();
});

window.byazenb.onTabUpdated(({ id, title, url, favicon }) => {
  if (id === activeTabId) {
    if (url) {
      currentUrl = url;
      els.omnibox.value = url;
      updateSecurityIcon(url);
      updateBookmarkStar(url);
      updateNavButtons();
    }
    if (title) document.title = `${title} - ByAzenB`;
  }
  // обновить в списке
  const tab = currentTabs.find(t => t.id === id);
  if (tab) {
    if (title) tab.title = title;
    if (url) tab.url = url;
    if (favicon) tab.favicon = favicon;
    renderTabs();
  }
});

window.byazenb.onNavLoading(({ loading }) => {
  isLoading = loading;
  if (loading) {
    els.progressBar.classList.add('loading');
  } else {
    els.progressBar.classList.remove('loading');
    els.progressFill.style.width = '100%';
    setTimeout(() => { els.progressFill.style.width = '0%'; }, 300);
  }
  updateNavButtons();
});

window.byazenb.onShowPage((page) => {
  showPage(page);
  if (page === 'history') window.byazenb.getHistory().then(renderHistoryPage);
  if (page === 'downloads') window.byazenb.getDownloads().then(renderDownloadsPage);
  if (page === 'bookmarks') renderBookmarksPage();
});

window.byazenb.onDownloadsUpdated((downloads) => renderDownloadsPage(downloads));
window.byazenb.onHistoryUpdated((history) => renderHistoryPage(history));
window.byazenb.onFindOpen(() => openFindBar());
window.byazenb.onBookmarkPrompt(() => els.bookmarkStar.click());

// Инициализация
async function init() {
  settings = await window.byazenb.getSettings();
  bookmarks = await window.byazenb.getBookmarks();
  isIncognito = await window.byazenb.isIncognito();
  
  els.settingHomepage.value = settings.homepage || '';
  els.settingSearchEngine.value = settings.searchEngine || 'https://www.google.com/search?q=%s';
  els.settingDownloadPath.value = settings.downloadPath || '';
  els.settingDarkMode.checked = !!settings.darkMode;
  els.settingAdBlock.checked = !!settings.adBlock;
  els.app.classList.toggle('theme-dark', !!settings.darkMode);
  els.app.classList.toggle('theme-light', !settings.darkMode);

  renderBookmarksBar();
  renderNewTabShortcuts();

  const tabs = await window.byazenb.listTabs();
  currentTabs = tabs;
  renderTabs();
  if (tabs.length > 0) {
    activeTabId = tabs[tabs.length - 1].id;
    currentUrl = tabs[tabs.length - 1].url;
    els.omnibox.value = currentUrl;
  }

  if (isIncognito) {
    els.incognitoBadge.classList.remove('hidden');
    document.body.style.background = '#1a1a2e';
  }

  // Показать newtab по умолчанию если домашняя страница - newtab
  showPage('newtab');

  // External links in settings
  document.querySelectorAll('a[data-link]').forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      window.byazenb.navigate(a.dataset.link);
      hideAllInternalPages();
    });
  });
}

init();
