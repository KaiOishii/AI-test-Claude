@echo off
chcp 65001 >nul
REM ============================================
REM   Windows用 インストーラー（統合アプリ）
REM ============================================
cd /d "%~dp0"
cd ..\..

cls
echo ===========================================
echo    タスク管理アプリ インストーラー（Windows用）
echo ===========================================
echo.

REM Node.js の確認
where node >nul 2>nul
if errorlevel 1 (
  echo [X] Node.js が見つかりません。
  echo.
  echo 先に「docs\Windows環境構築手順書.md」を見て
  echo Node.js をインストールしてください。
  echo.
  pause
  exit /b 1
)
for /f "delims=" %%v in ('node -v') do echo [OK] Node.js: %%v
echo.

echo パッケージをインストール中...（数分かかります）
call npm install

if errorlevel 1 (
  echo [X] インストールに失敗しました
  echo   docs\Windows環境構築手順書.md を確認してください
) else (
  echo ===========================================
  echo インストールが完了しました！
  echo.
  echo 起動するには：
  echo   ・ToDoリスト → ToDo起動.bat をダブルクリック
  echo   ・WBS管理    → WBS起動.bat をダブルクリック
  echo ===========================================
)
echo.
pause
exit /b
