#!/bin/bash
# macOS 起動スクリプト — ダブルクリックで両アプリが起動します

DIR="$(cd "$(dirname "$0")" && pwd)"

echo "==========================================="
echo "  ToDo & WBS アプリ 起動スクリプト"
echo "==========================================="
echo ""

if [ ! -f "$DIR/todo-app/.env.local" ] || [ ! -f "$DIR/wbs-app/.env.local" ]; then
  echo "⚠️  .env.local が見つかりません。"
  echo ""
  echo "セットアップ手順："
  echo "  1. todo-app/.env.example を todo-app/.env.local としてコピー"
  echo "  2. wbs-app/.env.example を wbs-app/.env.local としてコピー"
  echo "  3. 各 .env.local に Supabase の DATABASE_URL を入力"
  echo ""
  read -p "続けるには Enter を押してください..."
fi

if [ ! -d "$DIR/todo-app/node_modules" ]; then
  echo "📦 ToDoアプリのパッケージをインストール中..."
  (cd "$DIR/todo-app" && npm install)
  echo ""
fi

if [ ! -d "$DIR/wbs-app/node_modules" ]; then
  echo "📦 WBSアプリのパッケージをインストール中..."
  (cd "$DIR/wbs-app" && npm install)
  echo ""
fi

echo "🚀 アプリを起動しています..."

osascript - "$DIR" <<'END_SCRIPT'
on run argv
  set appDir to item 1 of argv
  tell application "Terminal"
    activate
    do script "cd " & quoted form of (appDir & "/todo-app") & " && npm run dev"
    do script "cd " & quoted form of (appDir & "/wbs-app") & " && npx next dev -p 3001"
  end tell
end run
END_SCRIPT

echo "ブラウザが開くまで少しお待ちください..."
sleep 5
open http://localhost:3000
open http://localhost:3001

echo ""
echo "✅ 起動しました！"
echo "  ToDoアプリ: http://localhost:3000"
echo "  WBSアプリ:  http://localhost:3001"
echo ""
echo "終了するには: 各ターミナルウィンドウで Control+C を押してください"
echo ""
read -p "このウィンドウは閉じてください..."
