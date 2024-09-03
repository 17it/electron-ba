window.addEventListener('DOMContentLoaded', () => {
    readFile()
})

let sufix = 'usdt@kline_1m'
let fileData = {}

function readFile() {
    var dom = document.getElementById('pairs')

    window.electronAPI.readFile({
        path: './config.yaml',
        cb: (err, data) => {
            data = JSON.parse(data)
            fileData = data

            dom.value = (data.pairs || []).map(i => i.replace(sufix, ''))
        }
    })
}

function submit() {
    var dom = document.getElementById('pairs')

    fileData.pairs = dom.value.split(',').map(i => `${i}${sufix}`)
    const str = JSON.stringify(fileData, null, 2)

    window.electronAPI.writeFile({
        path: './config.yaml',
        str: str,
        cb: (err) => {
            if (err) {
                console.log('writeFile error', err)
                return
            }

            console.log('保存成功，即将重启')
            window.electronAPI.relaunch() // 重启APP
        }
    })
}
