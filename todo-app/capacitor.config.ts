import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.yourname.todoapp',
  appName: 'ToDo App',
  // 本番デプロイ後のURLに変更してください (例: https://your-todo-app.vercel.app)
  server: {
    url: 'http://localhost:3000',
    cleartext: true,
  },
  ios: {
    contentInset: 'automatic',
  },
}

export default config
