#!/bin/bash
# ============================================
#  Mac用 インストーラー（統合アプリ）
# ============================================
cd "$(dirname "$0")/../.."

clear
echo "==========================================="
echo "   タスク管理アプリ インストーラー（Mac用）"
echo "==========================================="
echo ""

# Node.js の確認
if ! command -v node >/dev/null 2>&1; then
  echo "❌ Node.js が見つかりません。"
  echo ""
  echo "先に「docs/Mac環境構築手順書.md」を見て"
  echo "Node.js をインストールしてください。"
  echo ""
  read -p "Enterキーで閉じます..."
  exit 1
fi
echo "✅ Node.js: $(node -v)"
echo ""

echo "📦 パッケージをインストール中...（数分かかります）"
npm install

if [ $? -eq 0 ]; then
  echo ""
  echo "==========================================="
  echo "🎉 インストールが完了しました！"
  echo ""
  echo "起動するには："
  echo "  ・ToDoリスト → ToDo起動.command をダブルクリック"
  echo "  ・WBS管理    → WBS起動.command をダブルクリック"
  echo "==========================================="
else
  echo "❌ インストールに失敗しました"
  echo "   docs/Mac環境構築手順書.md を確認してください"
fi
echo ""
read -p "Enterキーで閉じます..."
