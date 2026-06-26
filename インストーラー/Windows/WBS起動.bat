@echo off
chcp 65001 >nul
REM WBS管理を起動します（Windows用）
cd /d "%~dp0"
cd ..\..\wbs-app

echo WBS管理を起動します...

if not exist node_modules (
  echo 初回のみパッケージをインストールします...
  call npm install
)

REM WBSは3001番ポートで起動（ToDoと同時に動かせるように）
start http://localhost:3001

echo.
echo ブラウザで http://localhost:3001 が開きます。
echo 止めたいときは Control + C を押してください。
echo.
call npx next dev -p 3001
