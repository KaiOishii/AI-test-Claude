#!/bin/bash
# ToDoリストを起動します（Mac用）
cd "$(dirname "$0")/../.."

echo "🚀 ToDo リストを起動します..."

if [ ! -d node_modules ]; then
  echo "📦 初回のみパッケージをインストールします..."
  npm install
fi

# 5秒後にブラウザを開く（サーバー起動待ち）
( sleep 5 && open http://localhost:3000/todos ) &

echo ""
echo "ブラウザで http://localhost:3000/todos が開きます。"
echo "止めたいときは Control + C を押してください。"
echo ""
npm run dev
