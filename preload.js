const { contextBridge, ipcRenderer } = require('electron/renderer')
const path = require('node:path')
const fs= require('fs')
let userPath = ''

window.addEventListener('DOMContentLoaded', () => {
    const replaceText = (selector, text) => {
        const element = document.getElementById(selector)
        if (element) element.innerText = text
    }

    for (const dependency of ['chrome', 'node', 'electron']) {
        replaceText(`${dependency}-version`, process.versions[dependency])
    }
})

contextBridge.exposeInMainWorld('electronAPI', {
    // 设置title
    setTitle: (title) => ipcRenderer.send('setTitle', title),

    // 重启APP
    relaunch: () => ipcRenderer.send('relaunch'),

    // 重连ws
    reconnectWs: () => ipcRenderer.send('reconnectWs'),

    // 关闭窗口
    closeWindow: (type) => ipcRenderer.send('closeWindow', type),

    // 读取文件
    readFile: (opt) => {
        const url = path.join(userPath, opt.path)
        fs.readFile(url, 'utf8', (err, dataStr) => {
            opt.cb && opt.cb(err, dataStr)
        })
    },

    // 写入文件
    writeFile: (opt) => {
        const url = path.join(userPath, opt.path)
        fs.writeFile(url, opt.str, (err) => {
            opt.cb && opt.cb(err)
        })
    },

    // socket内容更新
    onWsContent: (cb) => ipcRenderer.on('wsContent', (_event, value) => cb(value)),

    // 窗口隐身、取消隐身
    onWinInvisible: (cb) => ipcRenderer.on('winInvisible', (_event, value) => cb(value))
})

// 获取 userData 的路径 - app.getPath只能在主进程中调用，所以这里初始化的时候从main.js获取
ipcRenderer.send('getUserPath')
ipcRenderer.on('got-user-path', (event, arg) => userPath = arg)
