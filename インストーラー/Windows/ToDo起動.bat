@echo off
chcp 65001 >nul
REM ToDoリストを起動します（Windows用）
cd /d "%~dp0"
cd ..\..

echo ToDo リストを起動します...

if not exist node_modules (
  echo 初回のみパッケージをインストールします...
  call npm install
)

REM ブラウザを開く
start http://localhost:3000/todos

echo.
echo ブラウザで http://localhost:3000/todos が開きます。
echo 止めたいときは Control + C を押してください。
echo.
call npm run dev
