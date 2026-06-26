#!/bin/bash
# WBS管理を起動します（Mac用）
cd "$(dirname "$0")"
ROOT="$(cd ../.. && pwd)"
cd "$ROOT/wbs-app" || exit 1

echo "🚀 WBS管理を起動します..."

if [ ! -d node_modules ]; then
  echo "📦 初回のみパッケージをインストールします..."
  npm install
fi

# WBSは3001番ポートで起動（ToDoと同時に動かせるように）
( sleep 5 && open http://localhost:3001 ) &

echo ""
echo "ブラウザで http://localhost:3001 が開きます。"
echo "止めたいときは Control + C を押してください。"
echo ""
npx next dev -p 3001
