window.addEventListener('DOMContentLoaded', () => {
    checkMainWinVisible()
})

var mainWinVisiable = false

window.electronAPI.onWsContent((data) => {
    var dom = document.getElementById('pairMain')

    const arr = Object.keys(data).map(i => {
        const cls = data[i].includes('↓') ? 'down' : 'up'
        return `<p class="coin-item">${i}:<span class="${cls}">${data[i]}</span></p>`
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
