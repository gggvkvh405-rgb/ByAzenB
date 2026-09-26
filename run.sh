#!/bin/bash
set -e
echo "ByAzenB Browser - запуск"
if [ ! -f "node_modules/electron/dist/electron" ] && [ ! -f "node_modules/electron/dist/Electron.app/Contents/MacOS/Electron" ]; then
  echo "Electron не установлен, ставлю зависимости..."
  npm install
fi
npm start
