import { test, expect, type Page } from '@playwright/test'

const BASE_URL = 'http://localhost:3000'
const TEST_EMAIL = 'e2e_test@todo.example.com'
const TEST_PASSWORD = 'password123'
const TEST_NAME = 'テストユーザー'

async function ensureRegistered(page: Page) {
  await page.request.post(`${BASE_URL}/api/auth/register`, {
    data: { email: TEST_EMAIL, password: TEST_PASSWORD, name: TEST_NAME },
  })
  // 409 = already exists, both outcomes are fine
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
    await expect(page).toHaveURL(/\/login/)
  })

  test('新規登録画面が表示される', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`)
    await expect(page.getByRole('heading', { name: '新規登録' })).toBeVisible()
  })
})

test.describe('ToDoの操作（認証済み）', () => {
  test.beforeEach(async ({ page }) => {
    await ensureRegistered(page)
    await login(page)
  })

  test('ToDoの追加', async ({ page }) => {
    await page.getByText('+ 追加').click()
    await page.fill('input[required]', '買い物に行く')
    await page.getByRole('button', { name: '追加', exact: true }).click()
    await expect(page.getByText('買い物に行く')).toBeVisible()
  })

  test('ToDoの完了切り替え', async ({ page }) => {
    await page.getByText('+ 追加').click()
    await page.fill('input[required]', '完了テスト用タスク')
    await page.getByRole('button', { name: '追加', exact: true }).click()
    await expect(page.getByText('完了テスト用タスク')).toBeVisible()

    const listItem = page.locator('li').filter({ hasText: '完了テスト用タスク' })
    await listItem.locator('button').first().click()
    await expect(listItem.locator('p.line-through')).toBeVisible()
  })

  test('ToDoの削除', async ({ page }) => {
    await page.getByText('+ 追加').click()
    await page.fill('input[required]', '削除テスト用タスク')
    await page.getByRole('button', { name: '追加', exact: true }).click()
    await expect(page.getByText('削除テスト用タスク')).toBeVisible()

    const listItem = page.locator('li').filter({ hasText: '削除テスト用タスク' })
    await listItem.hover()
    await listItem.getByRole('button', { name: '削除' }).click()
    await expect(page.getByText('削除テスト用タスク')).not.toBeVisible()
  })

  test('ToDoの編集', async ({ page }) => {
    await page.getByText('+ 追加').click()
    await page.fill('input[required]', '編集前のタスク')
    await page.getByRole('button', { name: '追加', exact: true }).click()
    await expect(page.getByText('編集前のタスク')).toBeVisible()

    const listItem = page.locator('li').filter({ hasText: '編集前のタスク' })
    await listItem.hover()
    await listItem.getByRole('button', { name: '編集' }).click()

    const titleInput = page.locator('input[required]')
    await titleInput.fill('編集後のタスク')
    await page.getByRole('button', { name: '保存' }).click()
    await expect(page.getByText('編集後のタスク')).toBeVisible()
    await expect(page.getByText('編集前のタスク')).not.toBeVisible()
  })

  test('フィルター: 未完了のみ表示', async ({ page }) => {
    await page.getByText('+ 追加').click()
    await page.fill('input[required]', 'フィルターテスト用')
    await page.getByRole('button', { name: '追加', exact: true }).click()
    const listItem = page.locator('li').filter({ hasText: 'フィルターテスト用' })
    await listItem.locator('button').first().click()

    await page.getByRole('button', { name: '未完了' }).click()
    const completedItems = page.locator('li p.line-through')
    await expect(completedItems).toHaveCount(0)
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
    await expect(page.getByText('仕事')).toBeVisible()
  })

  test('カテゴリを選択してフィルタリング', async ({ page }) => {
    await page.locator('aside button:has-text("+")').click()
    await page.locator('aside input[placeholder="名前"]').fill('プライベート')
    await page.locator('aside button:has-text("追加")').click()

    await page.getByText('+ 追加').click()
    await page.fill('input[required]', 'プライベートのタスク')
    await page.locator('select').first().selectOption({ label: 'プライベート' })
    await page.getByRole('button', { name: '追加', exact: true }).click()

    await page.getByText('プライベート').first().click()
    await expect(page.getByText('プライベートのタスク')).toBeVisible()
  })
})
