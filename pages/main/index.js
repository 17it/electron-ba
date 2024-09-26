window.addEventListener('DOMContentLoaded', () => {
})

window.electronAPI.onWsContent((data) => {
    var dom = document.getElementById('pairMain')

    const arr = Object.keys(data).map(i => {
        const cls = data[i].includes('↓') ? 'down' : 'up'
        return `<p class="coin-item">${i}:<span class="${cls}">${data[i]}</span></p>`
    })

    dom.innerHTML = arr.join('')
})

function closeMainWin() {
    window.electronAPI.closeWindow('main')
}
