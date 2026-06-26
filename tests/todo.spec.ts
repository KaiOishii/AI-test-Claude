import { test, expect, type Page } from '@playwright/test'

const BASE_URL = 'http://localhost:3000'
const TEST_EMAIL = 'e2e_test@todo.example.com'
const TEST_PASSWORD = 'password123'
const TEST_NAME = 'テストユーザー'

async function ensureRegistered(page: Page) {
  await page.request.post(`${BASE_URL}/api/auth/register`, {
    data: { email: TEST_EMAIL, password: TEST_PASSWORD, name: TEST_NAME },
  })
}

async function login(page: Page) {
  await page.goto(`${BASE_URL}/login`)
  await page.fill('input[type="email"]', TEST_EMAIL)
  await page.fill('input[type="password"]', TEST_PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForURL(`${BASE_URL}/todos`)
}

test.describe('認証フロー', () => {
  test.beforeAll(async ({ request }) => {
    await request.post(`${BASE_URL}/api/auth/register`, {
      data: { email: TEST_EMAIL, password: TEST_PASSWORD, name: TEST_NAME },
    })
  })

  test('未認証時はloginにリダイレクト', async ({ page }) => {
    await page.goto(`${BASE_URL}/todos`)
    await page.waitForURL(`${BASE_URL}/login`)
    await expect(page).toHaveURL(/\/login/)
  })

  test('ログイン成功後にメイン画面へ遷移', async ({ page }) => {
    await login(page)
    await expect(page.getByRole('heading', { name: 'ToDo' })).toBeVisible()
    await expect(page.getByText(TEST_NAME)).toBeVisible()
  })

  test('ログアウト後にlogin画面へ遷移', async ({ page }) => {
    await login(page)
    await page.getByText('ログアウト').click()
    await page.waitForURL(`${BASE_URL}/login`)
  })
})

test.describe('ToDoの基本操作', () => {
  test.beforeEach(async ({ page }) => {
    await ensureRegistered(page)
    await login(page)
  })

  test('ToDoの追加', async ({ page }) => {
    await page.getByText('+ 追加').click()
    await page.fill('input[name="title"]', '買い物に行く')
    await page.getByRole('button', { name: '追加', exact: true }).click()
    await expect(page.getByText('買い物に行く').first()).toBeVisible()
  })

  test('ToDoの完了切り替え', async ({ page }) => {
    await page.getByText('+ 追加').click()
    await page.fill('input[name="title"]', '完了テスト用タスク')
    await page.getByRole('button', { name: '追加', exact: true }).click()
    const listItem = page.locator('li').filter({ hasText: '完了テスト用タスク' }).first()
    await listItem.locator('button').nth(2).click()
    await expect(page.locator('p.line-through').filter({ hasText: '完了テスト用タスク' }).first()).toBeVisible()
  })

  test('ToDoの削除', async ({ page }) => {
    await page.getByText('+ 追加').click()
    await page.fill('input[name="title"]', '削除テスト用タスク')
    await page.getByRole('button', { name: '追加', exact: true }).click()
    const listItem = page.locator('li').filter({ hasText: '削除テスト用タスク' }).first()
    await listItem.hover()
    await listItem.getByRole('button', { name: '削除' }).click()
    await expect(page.getByText('削除テスト用タスク')).not.toBeVisible()
  })

  test('ToDoの編集', async ({ page }) => {
    await page.getByText('+ 追加').click()
    await page.fill('input[name="title"]', '編集前のタスク')
    await page.getByRole('button', { name: '追加', exact: true }).click()
    const listItem = page.locator('li').filter({ hasText: '編集前のタスク' }).first()
    await listItem.hover()
    await listItem.getByRole('button', { name: '編集' }).click()
    await page.fill('input[name="title"]', '編集後のタスク')
    await page.getByRole('button', { name: '保存', exact: true }).click()
    await expect(page.getByText('編集後のタスク').first()).toBeVisible()
    await expect(page.getByText('編集前のタスク')).not.toBeVisible()
  })
})

test.describe('検索機能', () => {
  test.beforeEach(async ({ page }) => {
    await ensureRegistered(page)
    await login(page)
  })

  test('タイトルで検索できる', async ({ page }) => {
    await page.getByText('+ 追加').click()
    await page.fill('input[name="title"]', '検索テスト用タスク')
    await page.getByRole('button', { name: '追加', exact: true }).click()

    await page.fill('input[placeholder="タスクを検索..."]', '検索テスト')
    await expect(page.getByText('検索テスト用タスク').first()).toBeVisible()
  })
})

test.describe('優先度機能', () => {
  test.beforeEach(async ({ page }) => {
    await ensureRegistered(page)
    await login(page)
  })

  test('高優先度のToDoを追加できる', async ({ page }) => {
    await page.getByText('+ 追加').click()
    await page.fill('input[name="title"]', '高優先度タスク')
    await page.selectOption('select[name="priority"]', 'high')
    await page.getByRole('button', { name: '追加', exact: true }).click()
    const listItem = page.locator('li').filter({ hasText: '高優先度タスク' }).first()
    await expect(listItem.getByText('高', { exact: true })).toBeVisible()
  })
})

test.describe('フィルター機能', () => {
  test.beforeEach(async ({ page }) => {
    await ensureRegistered(page)
    await login(page)
  })

  test('未完了フィルターで完了済みが非表示', async ({ page }) => {
    await page.getByText('+ 追加').click()
    await page.fill('input[name="title"]', 'フィルターテスト')
    await page.getByRole('button', { name: '追加', exact: true }).click()
    const listItem = page.locator('li').filter({ hasText: 'フィルターテスト' }).first()
    await listItem.locator('button').nth(2).click()

    await page.getByRole('button', { name: '未完了' }).click()
    const items = page.locator('li p.line-through')
    await expect(items).toHaveCount(0)
  })
})

test.describe('カテゴリ管理', () => {
  test.beforeEach(async ({ page }) => {
    await ensureRegistered(page)
    await login(page)
  })

  test('カテゴリの追加', async ({ page }) => {
    await page.locator('aside button:has-text("+")').click()
    await page.locator('aside input[placeholder="名前"]').fill('仕事')
    await page.locator('aside button:has-text("追加")').click()
    await expect(page.locator('aside').getByText('仕事').first()).toBeVisible()
  })
})

test.describe('ダークモード', () => {
  test.beforeEach(async ({ page }) => {
    await ensureRegistered(page)
    await login(page)
  })

  test('ダークモード切り替えボタンが存在する', async ({ page }) => {
    const darkBtn = page.locator('button[title="ダークモード"], button[title="ライトモード"]').first()
    await expect(darkBtn).toBeVisible()
  })
})

test.describe('カレンダー表示', () => {
  test.beforeEach(async ({ page }) => {
    await ensureRegistered(page)
    await login(page)
  })

  test('カレンダービューに切り替えられる', async ({ page }) => {
    await page.getByRole('button', { name: 'カレンダー' }).click()
    await expect(page.getByRole('heading').filter({ hasText: '年' })).toBeVisible()
  })
})
