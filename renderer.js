window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        connectWs()
    }, 1000)
})

// 连ws
var wsObj = { btc: '', eth: '', ftt: '', arkm: '' }
function connectWs() {
    const socket = new window.WebSocket('wss://stream.binance.com:9443/stream?streams=');

    //连接成功回调
    socket.onopen = function (evt) {
        console.log("onopen ...");
        socket.send(JSON.stringify({"method": "SUBSCRIBE","params":["btcusdt@depth5@1000ms","ethusdt@depth5@1000ms","fttusdt@depth5@1000ms","arkmusdt@depth5@1000ms"],"id": 1}))
    }

    //消息监听
    socket.onmessage = function(evt) {
        var data = evt.data

        try {
            data = JSON.parse(data)
        }  catch (error) {
            data = {}
        }

        if (data && data.data && data.data.asks && data.data.asks.length) {
            const ask = data.data.asks[0]
            if (data.stream.includes('btcusdt')) {
                wsObj.btc = parseFloat(ask[0]).toFixed(2)
            }
            if (data.stream.includes('ethusdt')) {
                wsObj.eth = parseFloat(ask[0]).toFixed(2)
            }
            if (data.stream.includes('fttusdt')) {
                wsObj.ftt = parseFloat(ask[0]).toFixed(4)
            }
            if (data.stream.includes('arkmusdt')) {
                wsObj.arkm = parseFloat(ask[0]).toFixed(3)
            }

            window.electronAPI.setTitle(`btc:${wsObj.btc} ftt:${wsObj.ftt} arkm:${wsObj.arkm} eth:${wsObj.eth}`)
        }
    }

    //连接失败
    socket.onerror = function(evt){
        //关闭连接
        socket.close();
        console.log("onerror " + JSON.stringify(evt));
    }

    return socket;
}
