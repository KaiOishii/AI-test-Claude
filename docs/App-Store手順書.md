# App Store 公開手順書

## 全体の流れ

```
① Supabase でデータベースを作る（無料）
      ↓
② 環境変数を設定する
      ↓
③ Vercel にデプロイする（無料）
      ↓
④ Capacitor で iOS アプリを作る
      ↓
⑤ App Store に申請する（¥12,900/年）
```

---

## ① Supabase のセットアップ

### アカウント作成
1. https://supabase.com を開く
2. 「Start your project」→ GitHub でサインイン
3. 「New Project」→ 名前・パスワードを設定 → 「Create new project」（2〜3分かかります）

### データベースのスキーマを作成
1. 左メニューの「SQL Editor」
2. 「+ New query」
3. `supabase/todo-schema.sql` の内容をコピー&ペースト → 「Run」（▶）
4. 同様に `supabase/wbs-schema.sql` も実行

### 接続文字列を取得
1. 左メニュー「Project Settings」→「Database」
2. 「Connection string」タブ → 「URI」の文字列をコピー（これが DATABASE_URL）

---

## ② 環境変数を設定

**todo-app フォルダ**に `.env.local` ファイルを作成：
```
DATABASE_URL=（Supabaseからコピーした接続文字列）
JWT_SECRET=（ランダムな文字列 — 例: openssl rand -base64 32 で生成）
```

**wbs-app フォルダ**にも同様に `.env.local` を作成。

---

## ③ Vercel にデプロイ

### アカウント作成
1. https://vercel.com → GitHub でサインイン

### ToDoアプリをデプロイ
1. 「Add New Project」→ `AI-test-Claude` リポジトリを選択
2. **Root Directory** を `todo-app` に設定
3. Environment Variables に追加：
   - `DATABASE_URL` → Supabase の接続文字列
   - `JWT_SECRET` → ランダムな文字列
4. 「Deploy」

### WBSアプリをデプロイ
同様に Root Directory を `wbs-app` にして Deploy。

### デプロイ後
- 発行されたURL（例: `https://todo-app-xxx.vercel.app`）を確認
- `todo-app/capacitor.config.ts` の `server.url` をこのURLに変更
- `wbs-app/capacitor.config.ts` も同様に変更

---

## ④ Capacitor で iOS アプリを作る

### 前提条件
- Mac が必要
- Xcode がインストール済み（Mac App Store から無料）
- Apple Developer アカウント（¥12,900/年）— 先に登録しておく

### インストールと初期化（ToDoアプリ）

```bash
cd ~/AI-test-Claude/todo-app
npm install @capacitor/core @capacitor/ios
npx cap add ios
npx cap sync
npx cap open ios
```

Xcode が開いたら：
1. 左側のプロジェクト設定 → 「Signing & Capabilities」
2. 「Team」から Apple Developer アカウントを選択
3. 「Bundle Identifier」を変更（例: `com.yourname.todoapp`）

### WBSアプリも同様
```bash
cd ~/AI-test-Claude/wbs-app
npm install @capacitor/core @capacitor/ios
npx cap add ios
npx cap sync
npx cap open ios
```

---

## ⑤ App Store に提出

### Xcode からビルド
1. Xcode 上部メニュー「Product」→「Archive」
2. Archive が完了したら「Distribute App」
3. 「App Store Connect」を選択 → 次へ → アップロード完了

### App Store Connect で申請
1. https://appstoreconnect.apple.com にアクセス
2. 「マイ App」→「+」→「新規 App」
3. 以下を入力：
   - **プラットフォーム**: iOS
   - **名前**: アプリ名
   - **バンドルID**: Xcode で設定したもの
   - **SKU**: 任意の識別子
4. スクリーンショット・説明文を追加
5. ビルドを選択（Xcode からアップロードしたもの）
6. 「審査へ提出」→ 通常 1〜3 営業日で結果が届きます

---

## よくある質問

### Q. Supabase は有料ですか？
無料プランで十分です（500MB ストレージ、月 2GB 転送）。

### Q. Vercel は有料ですか？
無料プランで十分です（月 100GB 帯域幅）。

### Q. Apple Developer アカウントは必須ですか？
App Store に公開するには必須（¥12,900/年）。
自分の iPhone だけにインストールなら TestFlight（無料）も使えます。

### Q. Android には対応できますか？
Capacitor は Android にも対応しています。
`npx cap add android` を実行して Android Studio でビルドできます。
Google Play の登録料は一度だけ $25 です。
