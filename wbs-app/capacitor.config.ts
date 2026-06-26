import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.yourname.wbsapp',
  appName: 'WBS管理',
  // 本番デプロイ後のURLに変更してください (例: https://your-wbs-app.vercel.app)
  server: {
    url: 'http://localhost:3001',
    cleartext: true,
  },
  ios: {
    contentInset: 'automatic',
  },
}

export default config
