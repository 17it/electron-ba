window.addEventListener('DOMContentLoaded', () => {
    checkMainWinVisible()
})

var mainWinVisiable = true // 默认隐身

window.electronAPI.onWsContent((data, pairs) => {
    var dom = document.getElementById('pairMain')

    const fun = (x,y) => pairs.indexOf(x) > pairs.indexOf(y) ? 1 : -1
    const keys = Object.keys(data).sort(fun)
    const arr = keys.map(i => {
        const { price, trend } = data[i]
        const cls = price.includes('↓') ? 'down' : 'up'
        const cst = trend > 0 ? 'up' : 'down'
        return `<p class="coin-item"><span class="${cst} md">${i.toUpperCase()}: </span><span class="${cls}">${price}</span><span class="${cst} sm">${trend}%</span></p>`
    })

    dom.innerHTML = arr.join('')
})

window.electronAPI.onWinInvisible((data) => {
    checkMainWinVisible()
})

function checkMainWinVisible() {
    var body = document.body

    if (!mainWinVisiable) {
        body.classList.add('invisible')
        mainWinVisiable = true
    } else {
        body.classList.remove('invisible')
        mainWinVisiable = false
    }
}

function closeMainWin() {
    window.electronAPI.closeWindow('main')
}

function refreshMainWin() {
    window.electronAPI.reconnectWs()
}
