# Установка ByAzenB Browser

## Быстрый старт

```bash
git clone https://github.com/gggvkvh405-rgb/ByAzenB.git
cd ByAzenB
npm install
npm start
```

Если `npm install` падает с ошибкой `Electron failed to install`:

### Решение 1: Переустановить Electron
```bash
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### Решение 2: Использовать зеркало (Китай/Россия)
```bash
# Для пользователей с проблемами доступа к GitHub Releases
npm config set registry https://registry.npmjs.org/
ELECTRON_MIRROR="https://registry.npmmirror.com/-/binary/electron/" npm install
# или
ELECTRON_MIRROR="https://cdn.npmmirror.com/binaries/electron/" npm install
```

### Решение 3: Ручная установка бинарника
```bash
npm install --ignore-scripts
npx electron-builder install-app-deps
# Скачать вручную electron-v32.2.0-linux-x64.zip с https://github.com/electron/electron/releases
# и распаковать в node_modules/electron/dist
```

### Решение 4: Использовать Yarn
```bash
yarn install
yarn start
```

## Проверка

После установки должна появиться папка `node_modules/electron/dist/` с файлом `electron` (Linux/Mac) или `electron.exe` (Windows).

```bash
./node_modules/.bin/electron --version
# Должно вывести v32.x.x
```

## Сборка

```bash
npm run build        # для текущей ОС
npm run build:win    # Windows exe
npm run build:linux  # Linux AppImage
npm run build:mac    # macOS dmg (только на Mac)
```

Результат в `dist/`.

## Зависимости

- Node.js 18+ 
- На Linux нужны доп пакеты для Electron:
```bash
sudo apt-get install -y libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libpango-1.0-0 libcairo2 libasound2
```
