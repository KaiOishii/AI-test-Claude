# タスク管理アプリ

ToDo リストと WBS 管理を一つに統合したアプリです。
ローカル SQLite（設定不要）と クラウド Supabase（iPhone 同期）の両方に対応しています。

## アプリの機能

| | 🗒 ToDo リスト | 📊 WBS 管理 |
|---|---|---|
| URL | `/todos` | `/dashboard` |
| 何をする？ | やること管理・チェック | プロジェクト・タスク・工数・進捗管理 |
| 主な機能 | 追加/完了/検索/カテゴリ/カレンダー/通知 | プロジェクト/階層タスク/工数/進捗/今日のタスク |

両アプリとも白黒シンプルなデザインで統一しています。

## かんたん起動（初めての方）

### Mac
1. `インストーラー/Mac/インストール.command` をダブルクリック
2. `インストーラー/Mac/ToDo起動.command` または `WBS起動.command` をダブルクリック
3. ブラウザが自動で開きます

> 「開発元を確認できません」と出たら、**右クリック → 開く** を選んでください。

### Windows
1. `インストーラー/Windows/インストール.bat` をダブルクリック
2. `インストーラー/Windows/ToDo起動.bat` または `WBS起動.bat` をダブルクリック

## コマンドで起動する場合

```bash
# パッケージのインストール（初回のみ）
npm install

# アプリ起動
npm run dev

# ブラウザで開く
# ToDo: http://localhost:3000/todos
# WBS:  http://localhost:3000/dashboard
```

## 自動テストの実行

```bash
npm run test
# または
npx playwright test --reporter=list
```

→ `13 passed` と表示されれば全テスト成功。

## ファイル構成

```
AI-test-Claude/
├── app/                    ← Next.js アプリ（統合）
│   ├── api/auth/           ← 認証 API
│   ├── api/todos/          ← ToDo API
│   ├── api/categories/     ← カテゴリ API
│   ├── api/projects/       ← プロジェクト API
│   ├── api/tasks/          ← タスク API
│   ├── todos/              ← ToDo リスト画面
│   ├── dashboard/          ← WBS ダッシュボード
│   ├── projects/           ← WBS プロジェクト
│   └── today/              ← 今日のタスク
├── lib/
│   ├── db.ts               ← DB 両対応レイヤー（SQLite/Supabase）
│   ├── auth.ts             ← JWT 認証
│   └── types.ts            ← 型定義
├── tests/                  ← Playwright 自動テスト
├── docs/                   ← 手順書・ガイド
│   ├── Mac環境構築手順書.md
│   ├── Windows環境構築手順書.md
│   ├── アプリ起動手順書.md
│   ├── iPhone導入ガイド.md
│   └── App-Store手順書.md
├── インストーラー/           ← 簡単起動スクリプト
│   ├── Mac/
│   └── Windows/
├── supabase/               ← Supabase スキーマ（本番用）
├── 人間確認用/               ← プロジェクト概要・動作確認記録
└── .env.example            ← 環境変数の設定例
```

## データベース切り替え

| 設定 | 使用DB | 用途 |
|---|---|---|
| `DATABASE_URL` 未設定 | ローカル SQLite（`.data/app.db`） | 開発・ローカル |
| `DATABASE_URL` あり | クラウド Supabase | 本番・iPhone同期 |

詳細は `supabase/` フォルダと `docs/App-Store手順書.md` を参照してください。

## ゲーム化機能（クエストログ）

画面左上の「⚔ クエスト」ボタンをクリックすると、今日のタスクがクエストとして表示されます。
完了するとアニメーションが出て、連続達成日数（ストリーク）が記録されます。
