const { app, BrowserWindow } = require('electron')
const path = require('path')
const url = require('url')
let win
const createWindow = () => {
  win = new BrowserWindow({
    width: 800,
    height: 600
  })
  const URL = url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file',
    slashes: true
  })

  win.loadURL(URL)

  //win.webContents.openDevTools()

  win.on('close', () => {
    win = null
  })
}

// 通信模块，mian process与renderer process（web page）
const { ipcMain } = require('electron')
// 监听web page里发出的message
ipcMain.on('asynchronous-message', (event, arg) => {
  console.log('mian1' + arg) // prints "ping"
  event.sender.send('asynchronous-reply', 'pong') // 在main process里向web page发出message
})

ipcMain.on('synchronous-message', (event, arg) => {
  console.log('mian2' + arg) // prints "ping"
  event.returnValue = 'pong'
})
app.on('ready', createWindow)

