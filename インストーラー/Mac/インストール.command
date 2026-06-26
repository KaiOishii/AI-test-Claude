#!/bin/bash
# ============================================
#  Mac用 インストーラー
#  ToDo / WBS から選んでインストールできます
# ============================================
cd "$(dirname "$0")"
ROOT="$(cd ../.. && pwd)"

clear
echo "==========================================="
echo "   アプリ インストーラー（Mac用）"
echo "==========================================="
echo ""

# Node.js の確認
if ! command -v node >/dev/null 2>&1; then
  echo "❌ Node.js が見つかりません。"
  echo ""
  echo "先に「【Mac】環境構築手順書.md」を見て"
  echo "Node.js をインストールしてください。"
  echo ""
  read -p "Enterキーで閉じます..."
  exit 1
fi
echo "✅ Node.js: $(node -v)"
echo ""

# インストール対象を選択
echo "どのアプリをインストールしますか？"
echo ""
echo "   1) ToDoリスト だけ"
echo "   2) WBS管理 だけ"
echo "   3) 両方"
echo ""
read -p "番号を入力して Enter (1 / 2 / 3): " choice
echo ""

install_app() {
  local name="$1"; local label="$2"
  echo "-------------------------------------------"
  echo "📦 ${label} をインストール中...（数分かかります）"
  echo "-------------------------------------------"
  (cd "$ROOT/$name" && npm install)
  echo "✅ ${label} のインストール完了"
  echo ""
}

case "$choice" in
  1) install_app "todo-app" "ToDoリスト" ;;
  2) install_app "wbs-app" "WBS管理" ;;
  3) install_app "todo-app" "ToDoリスト"; install_app "wbs-app" "WBS管理" ;;
  *) echo "⚠️ 1・2・3 のいずれかを入力してください。"; read -p "Enterで閉じます..."; exit 1 ;;
esac

echo "==========================================="
echo "🎉 インストールが完了しました！"
echo ""
echo "起動するには："
echo "  ・ToDoリスト → ToDo起動.command をダブルクリック"
echo "  ・WBS管理    → WBS起動.command をダブルクリック"
echo "==========================================="
echo ""
read -p "Enterキーで閉じます..."
