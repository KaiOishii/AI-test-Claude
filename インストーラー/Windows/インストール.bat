@echo off
chcp 65001 >nul
REM ============================================
REM   Windows用 インストーラー
REM   ToDo / WBS から選んでインストールできます
REM ============================================
cd /d "%~dp0"
cd ..\..
set "ROOT=%cd%"

cls
echo ===========================================
echo    アプリ インストーラー（Windows用）
echo ===========================================
echo.

REM Node.js の確認
where node >nul 2>nul
if errorlevel 1 (
  echo [X] Node.js が見つかりません。
  echo.
  echo 先に「【Windows】環境構築手順書.md」を見て
  echo Node.js をインストールしてください。
  echo.
  pause
  exit /b 1
)
for /f "delims=" %%v in ('node -v') do echo [OK] Node.js: %%v
echo.

echo どのアプリをインストールしますか？
echo.
echo    1) ToDoリスト だけ
echo    2) WBS管理 だけ
echo    3) 両方
echo.
set /p choice="番号を入力して Enter (1 / 2 / 3): "
echo.

if "%choice%"=="1" ( call :install todo-app "ToDoリスト" & goto done )
if "%choice%"=="2" ( call :install wbs-app "WBS管理" & goto done )
if "%choice%"=="3" ( call :install todo-app "ToDoリスト" & call :install wbs-app "WBS管理" & goto done )

echo [!] 1・2・3 のいずれかを入力してください。
pause
exit /b 1

:install
echo -------------------------------------------
echo インストール中: %~2 （数分かかります）
echo -------------------------------------------
pushd "%ROOT%\%~1"
call npm install
popd
echo [OK] %~2 のインストール完了
echo.
exit /b

:done
echo ===========================================
echo インストールが完了しました！
echo.
echo 起動するには：
echo   ・ToDoリスト → ToDo起動.bat をダブルクリック
echo   ・WBS管理    → WBS起動.bat をダブルクリック
echo ===========================================
echo.
pause
exit /b
