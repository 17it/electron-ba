window.addEventListener('DOMContentLoaded', () => {
    readFile()
})

let fileData = {}

function readFile() {
    var dom = document.getElementById('remind')

    window.electronAPI.readFile({
        path: './config.yaml',
        cb: (err, data) => {
            data = JSON.parse(data)
            fileData = data

            dom.value = data.reminds || []
        }
    })
}

function submit() {
    var dom = document.getElementById('remind')

    fileData.reminds = dom.value.split(',')
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
