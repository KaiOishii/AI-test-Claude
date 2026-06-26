#!/bin/bash
# WBS管理を起動します（Mac用）
cd "$(dirname "$0")/../.."

echo "🚀 WBS 管理を起動します..."

if [ ! -d node_modules ]; then
  echo "📦 初回のみパッケージをインストールします..."
  npm install
fi

# 5秒後にブラウザを開く（サーバー起動待ち）
( sleep 5 && open http://localhost:3000/dashboard ) &

echo ""
echo "ブラウザで http://localhost:3000/dashboard が開きます。"
echo "止めたいときは Control + C を押してください。"
echo ""
npm run dev
