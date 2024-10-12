window.addEventListener('DOMContentLoaded', () => {
    checkMainWinVisible()
})

var mainWinVisiable = false

window.electronAPI.onWsContent((data) => {
    var dom = document.getElementById('pairMain')

    const arr = Object.keys(data).map(i => {
        const { price, trend } = data[i]
        const cls = price.includes('↓') ? 'down' : 'up'
        const cst = trend > 0 ? 'up' : 'down'
        return `<p class="${cls} coin-item">${i}:<span>${price}</span><span class="${cst}">${trend}%</span></p>`
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
