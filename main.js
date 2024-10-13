const { app, BrowserWindow, Notification, Menu, Tray, nativeImage, ipcMain } = require('electron')
const { connectWs } = require('./util/wsNode')
const path = require('node:path')
const fs = require('fs')

// 设置系统代理
// app.commandLine.appendSwitch('proxy-server', 'socks5://127.0.0.1:7890')

let mainWin
let pairWin
let proxyWin

/**
 * 有两种方法可以链接websocket
 *   1.使用nodejs的模块ws，详见util/wsNode
 *   2.在webview里使用window.websocket，详见index.html里引用的renderer.js，然后通过ipcMain传给主进程main.js里，然后展示到菜单栏
 *
 *   比较：
 *      方法2在关闭窗口后会中断websocket连接，而方法1不会
 */
const createWindow = () => {
    mainWin = new BrowserWindow({
        width: 170,
        height: 160,
        frame: false,
        transparent: true,
        backgroundColor: '#00000000',
        hasShadow: false, // 解决透明窗口重影
        webPreferences: {
            nodeIntegration: true,
            preload: path.join(__dirname, 'preload.js')
        }
    })

    getConfig((data) => {
        if (data && data.socks) {
            mainWin.webContents.session.setProxy({
                proxyRules: data.socks
            })
        }
    })

    // mainWin.loadFile('index.html')
    // ipcMain.on('setTitle', (event, str) => setTrayTitle(str)) // 监听setTitle事件

    // mainWin.webContents.openDevTools()

    // mainWin.loadURL('https://www.google.com/')
    mainWin.loadFile('pages/main/index.html')
}

// 消息通知
const NOTIFICATION_TITLE = '新消息'
const NOTIFICATION_BODY = 'Notification from the Main process'
function showNotification (msg) {
    new Notification({ title: NOTIFICATION_TITLE, body: msg || NOTIFICATION_BODY }).show()
}

// 读取配置文件
function getConfig(callBack) {
    const url = path.join(app.getPath('userData'), './config.yaml')

    fs.readFile(url, 'utf8', (err, dataStr) => {
        const data = JSON.parse(dataStr)

        callBack(data, err)
    })
}

// 设置监听
function setListener() {
    // 监听重连ws事件
    ipcMain.on('reconnectWs', (event) => wsInit())

    // 重启APP
    ipcMain.on('relaunch', (event) => {
        app.quit()
    })

    // 监听窗口关闭
    ipcMain.on('closeWindow', (event, type) => {
        if (type === 'pair') {
            pairWin.destroy()
        }
        if (type === 'proxy') {
            proxyWin.destroy()
        }
        if (type === 'main') {
            mainWin.destroy()
        }
    })

    // 获取userData的路径
    ipcMain.on('getUserPath', (event) => {
        event.sender.send('got-user-path', app.getPath('userData'))
    })
}

// 菜单栏
let tray = null
let contextMenu
function initTray(flag) {
    const icon = nativeImage.createFromPath(path.join(__dirname, 'icon.png'))
    // const icon = nativeImage.createFromDataURL('data:image/png;base64,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')
    if (!tray) {
        tray = new Tray(icon)
    }

    const label = !mainWin.isDestroyed() && mainWin.isAlwaysOnTop() ? '取消置顶' : '置顶'
    contextMenu = Menu.buildFromTemplate([
        {
            label: '设置币对',
            click: function(){
                setParis()
            }
        },
        {
            label: '设置代理',
            click: function(){
                setProxy()
            }
        },
        {
            label: label,
            id: 'set-top',
            click: function(){
                setOnTop()
            }
        },
        {
            label: '隐身/取消隐身',
            click: function(){
                setInvisible()
            }
        },
        {
            label: '退出',
            click: function(){
                app.quit()
            }
        }
    ]);

    tray.setToolTip('ba')
    flag && tray.closeContextMenu()
    tray.setContextMenu(contextMenu)
}
function setTrayTitle(title) {
    tray.setTitle(title)
}

// 连接ws
function wsInit() {
    connectWs((type, msg, extra, pairs) => {
        if (type === 'title') {
            try {
                if (mainWin.isDestroyed()) {
                    setTrayTitle(msg)
                } else {
                    mainWin && mainWin.webContents && mainWin.webContents.send('wsContent', extra, pairs)
                    setTrayTitle('ba')
                }
            } catch (_) {}
        }
        if (type === 'notify') {
            showNotification(msg)
        }
        if (type === 'close' || type === 'error') {
            wsInit()
        }
    })
}

// 设置代理
function setProxy() {
    proxyWin = new BrowserWindow({
        titleBarStyle: 'hidden',
        titleBarOverlay: {
            color: '#2f3241',
            symbolColor: '#74b1be',
            height: 60
        },
        width: 400,
        height: 300,
        webPreferences: {
            nodeIntegration: true,
            preload: path.join(__dirname, 'preload.js')
        }
    })

    // proxyWin.webContents.openDevTools()

    proxyWin.loadFile('pages/proxy/proxy.html')
}

// 窗口置顶
function setOnTop() {
    if (!mainWin.isDestroyed()) {
        const flag = mainWin.isAlwaysOnTop()
        mainWin.setAlwaysOnTop(!flag)
    }

    initTray(true)
}

// 窗口隐身、取消隐身
function setInvisible() {
    if (!mainWin.isDestroyed()) {
        mainWin && mainWin.webContents && mainWin.webContents.send('winInvisible')
    }
}

// 设置币对
function setParis() {
    pairWin = new BrowserWindow({
        titleBarStyle: 'hidden',
        titleBarOverlay: {
            color: '#2f3241',
            symbolColor: '#74b1be',
            height: 60
        },
        width: 400,
        height: 300,
        webPreferences: {
            nodeIntegration: true,
            preload: path.join(__dirname, 'preload.js')
        }
    })

    // pairWin.webContents.openDevTools()

    pairWin.loadFile('pages/pair/pair.html')
}

app.whenReady().then(() => {
    createWindow()

    initTray()
    setTrayTitle('ba')

    setListener()

    wsInit()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})
