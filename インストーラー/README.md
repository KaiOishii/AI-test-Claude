# 📦 インストーラー

ToDo リストと WBS 管理が一つになった**統合アプリ**を起動するツールです。
OS（パソコンの種類）に合うフォルダを開いてください。

---

## どのフォルダを使う？

| あなたの環境 | 開くフォルダ | 使うファイル |
|---|---|---|
| 🍎 **Mac** | `Mac/` | `インストール.command` |
| 🪟 **Windows** | `Windows/` | `インストール.bat` |
| 📱 **iPhone** | `../docs/iPhone導入ガイド.md` | ガイドを読む |

---

## 使い方（Mac / Windows 共通の流れ）

```
① インストール（インストール.command または インストール.bat）
      ↓
② 起動（ToDo起動 / WBS起動）
      ↓
③ ブラウザでアプリが開く 🎉
```

### Mac
1. `Mac/インストール.command` をダブルクリック
2. 完了したら `ToDo起動.command` または `WBS起動.command` をダブルクリック

> ⚠️ 初回は「開発元を確認できません」と出る場合があります。
> その時は **右クリック →「開く」** を選んでください。

### Windows
1. `Windows\インストール.bat` をダブルクリック
2. 完了したら `ToDo起動.bat` または `WBS起動.bat` をダブルクリック

> ⚠️ 「WindowsによってPCが保護されました」と出たら
> **「詳細情報」→「実行」** を選んでください。

### iPhone
`../docs/iPhone導入ガイド.md` を読んでください。

---

## 前提：先に環境構築が必要です

Node.js のインストールが必要です。まだの場合：

- Mac → `../docs/Mac環境構築手順書.md`
- Windows → `../docs/Windows環境構築手順書.md`

---

## アプリのURL

| アプリ | URL |
|---|---|
| **ToDo リスト** | http://localhost:3000/todos |
| **WBS 管理** | http://localhost:3000/dashboard |

どちらも同じ `http://localhost:3000` で動きます。
