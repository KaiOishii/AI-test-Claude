const { app, BrowserWindow } = require('electron')
const { spawn } = require('child_process')
const path = require('path')
const http = require('http')

let mainWindow
let nextServer

const PORT = 3000

function waitForServer(cb, retries = 40) {
  http.get(`http://localhost:${PORT}`, (res) => {
    if (res.statusCode && res.statusCode < 500) {
      cb()
    } else if (retries > 0) {
      setTimeout(() => waitForServer(cb, retries - 1), 500)
    }
  }).on('error', () => {
    if (retries > 0) setTimeout(() => waitForServer(cb, retries - 1), 500)
  })
}

function startNextServer() {
  const cwd = path.join(__dirname, '..')
  const isPackaged = app.isPackaged

  if (isPackaged) {
    // Production: run built server
    nextServer = spawn('node', ['node_modules/.bin/next', 'start', '-p', String(PORT)], {
      cwd,
      shell: process.platform === 'win32',
    })
  } else {
    // Development: next dev is usually already running; skip if port is open
  }

  if (nextServer) {
    nextServer.stdout?.on('data', d => process.stdout.write(d))
    nextServer.stderr?.on('data', d => process.stderr.write(d))
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#f5f5f4',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: {
      contextIsolation: true,
    },
    title: 'タスク管理',
  })

  mainWindow.loadURL(`http://localhost:${PORT}`)
  mainWindow.on('closed', () => { mainWindow = null })
}

app.whenReady().then(() => {
  startNextServer()
  waitForServer(createWindow)
})

app.on('window-all-closed', () => {
  if (nextServer) nextServer.kill()
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  if (nextServer) nextServer.kill()
})

app.on('activate', () => {
  if (!mainWindow) waitForServer(createWindow)
})
