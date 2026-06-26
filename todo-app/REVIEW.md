# コードレビュー & 実装解説

## 概要

このドキュメントでは、ToDoリストアプリの実装内容・設計判断・各コードの役割を詳しく解説します。

---

## 技術スタック

| 技術 | 用途 | 選定理由 |
|------|------|----------|
| Next.js 16 (App Router) | フレームワーク | サーバー・クライアント両方のコードを1プロジェクトで管理できる |
| TypeScript | 型安全性 | 実行前にバグを発見でき、IDEの補完も効く |
| Tailwind CSS v4 | スタイリング | クラス名で白黒デザインを素早く実装できる |
| better-sqlite3 | データベース | ローカル動作・高速・バイナリダウンロード不要 |
| bcryptjs | パスワードハッシュ | ブルートフォース耐性のあるハッシュ化 |
| jose | JWTトークン | 軽量かつEdge Runtime対応のJWT実装 |
| Playwright | E2Eテスト | 実際のブラウザで動作確認できる |

---

## ディレクトリ構造

```
todo-app/
├── lib/
│   ├── db.ts          データベース接続・テーブル初期化
│   ├── auth.ts        JWT生成・検証・セッション取得
│   └── types.ts       共通TypeScript型定義
├── app/
│   ├── page.tsx       ルート（認証状態に応じてリダイレクト）
│   ├── layout.tsx     HTMLルートレイアウト
│   ├── globals.css    グローバルスタイル
│   ├── login/         ログインページ
│   ├── register/      新規登録ページ
│   ├── todos/         メイン画面（SSR + クライアント）
│   └── api/
│       ├── auth/      register・login・logout・me
│       ├── todos/     CRUD
│       └── categories/ CRUD
├── proxy.ts           認証ゲートウェイ（旧middleware）
├── tests/
│   └── todo.spec.ts   Playwright E2Eテスト（11件）
└── playwright.config.ts
```

---

## 各ファイルの実装解説

### `lib/db.ts` — データベース層

```ts
const db = new Database(path.join(DB_DIR, 'todos.db'))
db.exec(`CREATE TABLE IF NOT EXISTS users (...)`)
```

**何をしているか**:
- `better-sqlite3` でSQLiteファイルに接続する
- `CREATE TABLE IF NOT EXISTS` でサーバー起動のたびにテーブルが存在することを保証する（既存データは消えない）
- モジュールとしてexportし、必要な場所で `import db from '@/lib/db'` して使う

**設計のポイント**:
- SQLiteはサーバー1台で動作する。将来的にPostgreSQLへ移行する場合はSQLのクエリはほぼそのまま使える。
- `process.cwd()/.data/` にDBファイルを置くことで、アプリと同じディレクトリで管理できる。

**スキーマの関係**:
```
users ──< categories   (1対多: 1ユーザーが複数カテゴリを持つ)
users ──< todos        (1対多: 1ユーザーが複数ToDoを持つ)
categories ──< todos   (1対多: 1カテゴリに複数ToDo)
```

---

### `lib/auth.ts` — 認証ユーティリティ

```ts
export async function createToken(userId: string): Promise<string>
export async function verifyToken(token: string): Promise<{ userId: string } | null>
export async function getSession(): Promise<{ userId: string } | null>
```

**何をしているか**:
- `createToken`: ユーザーIDを `HS256` アルゴリズムで署名し、7日間有効なJWTを発行する
- `verifyToken`: JWTの署名と有効期限を検証し、ペイロードからuserIdを返す。無効なら `null`
- `getSession`: HTTPOnly Cookieから `auth_token` を読み取り、検証してセッション情報を返す。APIルートやサーバーコンポーネントから呼ぶ

**セキュリティの考慮**:
- HTTPOnly Cookie: JavaScriptから読めないのでXSS攻撃でTokenを盗まれない
- `jose` ライブラリはEdge Runtimeでも動くため、`proxy.ts`（旧middleware）でも使える
- 本番環境では `JWT_SECRET` を環境変数で設定することが必須

---

### `proxy.ts` — 認証ゲートウェイ（Next.js 16の新名称）

> Next.js 16から `middleware.ts` は `proxy.ts` に改名された。機能は同じ。

```ts
export async function proxy(req: NextRequest) {
  // 公開パスはスルー
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) return NextResponse.next()
  // Cookieのトークン検証
  const token = req.cookies.get('auth_token')?.value
  if (!token) return NextResponse.redirect(new URL('/login', req.url))
  // 無効なトークンならCookieを削除してloginへ
  const session = await verifyToken(token)
  if (!session) { res.cookies.delete('auth_token'); redirect('/login') }
}
```

**何をしているか**:
- 全てのリクエストを通過する前にCookieのJWTを検証する
- 未認証の場合は `/login` にリダイレクトする
- `/login`、`/register`、`/api/auth/*` は認証不要なのでスルーする

**重要性**:
- APIルートやページは個別に認証チェックもしているが、proxyが最初の防衛ラインとなる
- 静的ファイル（`_next/static`）はmatcherで除外することでパフォーマンスを保つ

---

### `app/api/auth/register/route.ts` — ユーザー登録

```ts
const hashed = await hash(password, 10)  // saltRounds=10
const id = randomUUID()
db.prepare('INSERT INTO users ...').run(id, email, hashed, name)
const token = await createToken(id)
res.cookies.set('auth_token', token, { httpOnly: true, maxAge: 60 * 60 * 24 * 7 })
```

**処理の流れ**:
1. 入力バリデーション（空欄チェック）
2. メールアドレスの重複チェック（既存ユーザーがいれば409を返す）
3. bcryptでパスワードをハッシュ化（`saltRounds=10` はセキュリティと速度のバランスが取れた値）
4. UUIDでユーザーIDを生成してDBに挿入
5. JWTを発行しCookieにセット → 登録直後に自動ログイン状態になる

---

### `app/api/todos/route.ts` — ToDo一覧取得・追加

```ts
// GET: ログイン中ユーザーのToDoをカテゴリ情報とJOINして取得
const todos = db.prepare(`
  SELECT t.*, c.name as category_name
  FROM todos t
  LEFT JOIN categories c ON t.category_id = c.id
  WHERE t.user_id = ?
  ORDER BY t.created_at DESC
`).all(session.userId)
```

**設計のポイント**:
- `?` プレースホルダーを使うことでSQLインジェクションを防ぐ
- `LEFT JOIN` でカテゴリ情報を一緒に取得することで、クライアント側で追加のAPIコールが不要
- `WHERE t.user_id = ?` で他のユーザーのデータには絶対にアクセスできない

---

### `app/todos/page.tsx` — サーバーコンポーネント

```ts
export default async function TodosPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  
  const todos = db.prepare(`...`).all(session.userId)
  const categories = db.prepare('...').all(session.userId)
  
  return <TodosClient user={user} initialTodos={todos} initialCategories={categories} />
}
```

**何をしているか**:
- Next.js App RouterのServer Componentとして動く（`'use client'` がない）
- サーバーサイドで認証チェックとデータ取得を行い、結果をクライアントコンポーネントに渡す
- 初期データをSSRで取得することで、画面表示が速く、SEOにも有利

**SSRとCSRの分担**:
- `page.tsx`（SSR）: 初期データ取得・認証確認
- `TodosClient.tsx`（CSR）: ユーザー操作・リアルタイムな状態更新

---

### `app/todos/TodosClient.tsx` — クライアントコンポーネント

**状態管理**:
```ts
const [todos, setTodos] = useState(initialTodos)       // ToDoリスト
const [categories, setCategories] = useState(...)      // カテゴリリスト
const [filter, setFilter] = useState<Filter>('all')    // 表示フィルター
const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
const [showForm, setShowForm] = useState(false)        // モーダル表示
const [editingTodo, setEditingTodo] = useState(...)    // 編集中のToDo
```

**フィルタリングの実装**:
```ts
const filtered = useMemo(() => {
  let result = todos
  if (selectedCategory) result = result.filter(t => t.category_id === selectedCategory)
  if (filter === 'today') result = result.filter(t => isToday(t.due_date))
  if (filter === 'pending') result = result.filter(t => !t.completed)
  if (filter === 'completed') result = result.filter(t => t.completed)
  return result
}, [todos, filter, selectedCategory])
```

- `useMemo` で不要な再計算を防ぐ
- フィルターとカテゴリ選択を組み合わせて絞り込める
- APIを呼ばずクライアント側で計算するので即座に反映される

**追加・編集の共通モーダル**:
- `editingTodo` が `null` なら「追加モーダル」、値があれば「編集モーダル」
- 同一のフォームを使い回すことでコード量を削減

---

## UIデザインの実装

**白黒デザインの実現方法**:
```css
/* globals.css */
body { background-color: #ffffff; color: #000000; }
```

```tsx
// ボタン: 黒背景・白文字
className="bg-black text-white hover:bg-gray-800"

// 入力フォーム: 黒枠
className="border border-black px-3 py-2"

// 完了済みToDo: 取り消し線・グレー文字
className={todo.completed ? 'line-through text-gray-400' : ''}

// チェックボックス: 完了時に黒塗り
className={`border ${todo.completed ? 'bg-black border-black' : 'border-black'}`}
```

**アクセシビリティ**:
- ホバー時だけ編集・削除ボタンを表示（`group-hover:opacity-100`）
- フォーカスリング（`focus:ring-1 focus:ring-black`）でキーボード操作に対応

---

## テスト設計（Playwright）

**テストの構成（11件）**:

| グループ | テスト | 内容 |
|----------|--------|------|
| 認証フロー | 4件 | リダイレクト・ログイン・ログアウト・登録画面表示 |
| ToDo操作 | 5件 | 追加・完了・削除・編集・フィルタリング |
| カテゴリ管理 | 2件 | 追加・カテゴリでのフィルタリング |

**テストの工夫**:
```ts
// テスト前に固定メールでユーザーを登録（冪等性を確保）
async function ensureRegistered(page: Page) {
  await page.request.post(`/api/auth/register`, {...})
  // 409 (already exists) も正常として扱う
}
```

- `Date.now()` ベースの動的メールを避け、固定メール `e2e_test@todo.example.com` を使用
- `test.beforeEach` でログイン状態を確立してからテストを実行
- 各テストが独立して動くよう、テスト内でToDoを作成してから操作する

---

## セキュリティチェックリスト

| 項目 | 対応状況 |
|------|----------|
| SQLインジェクション | ✅ プレースホルダー（`?`）を全クエリで使用 |
| XSS | ✅ ReactはデフォルトでHTMLエスケープ、dangerouslySetInnerHTMLは不使用 |
| パスワード平文保存 | ✅ bcryptjs（saltRounds=10）でハッシュ化 |
| セッション固定攻撃 | ✅ ログイン/登録時に新しいJWTを発行 |
| 認証バイパス | ✅ proxy.tsとAPIルート両方で認証チェック |
| 他ユーザーのデータアクセス | ✅ 全クエリで `WHERE user_id = ?` を使用 |
| トークン盗難（XSS経由） | ✅ HttpOnly Cookie でJSからアクセス不可 |

---

## 今後の改善点（将来対応）

1. **パスワードリセット**: メール送信機能（SendGrid等）が必要
2. **リアルタイム同期**: WebSocketまたはServer-Sent Eventsで他端末の変更を即座に反映
3. **PWA対応**: `manifest.json` と Service Worker を追加してiPhoneのホーム画面に追加可能にする
4. **ネイティブアプリ**: React NativeまたはFlutterでこのAPIを使うネイティブアプリを作成
5. **入力バリデーション**: zodやvalibotでスキーマバリデーションを追加
6. **レート制限**: ログイン試行回数の制限（ブルートフォース対策）

---

## テスト結果

```
Running 11 tests using 1 worker

  ✓ 認証フロー › 未認証時はloginにリダイレクト
  ✓ 認証フロー › ログイン成功後にメイン画面へ遷移
  ✓ 認証フロー › ログアウト後にlogin画面へ遷移
  ✓ 認証フロー › 新規登録画面が表示される
  ✓ ToDoの操作 › ToDoの追加
  ✓ ToDoの操作 › ToDoの完了切り替え
  ✓ ToDoの操作 › ToDoの削除
  ✓ ToDoの操作 › ToDoの編集
  ✓ ToDoの操作 › フィルター: 未完了のみ表示
  ✓ カテゴリ管理 › カテゴリの追加
  ✓ カテゴリ管理 › カテゴリを選択してフィルタリング

  11 passed (11.3s)
```
