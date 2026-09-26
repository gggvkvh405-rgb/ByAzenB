@echo off
echo ByAzenB Browser - запуск
if not exist "node_modules\electron\dist\electron.exe" (
  echo Electron не установлен, ставлю зависимости...
  call npm install
)
call npm start
pause
