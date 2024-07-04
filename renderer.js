window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        connectWs()
    }, 1000)
})

// 连ws
var wsObj = { btc: '', eth: '', ftt: '', arkm: '' }
var socket
function connectWs() {
    function connect() {
        socket = new window.WebSocket('wss://stream.binance.com:9443/stream?streams=');
    }
    connect()

    //连接成功回调
    socket.onopen = function (evt) {
        console.log("onopen ...");

        socket.send(JSON.stringify({
            "method": "SUBSCRIBE",
            "params":["btcusdt@kline_1m","ethusdt@kline_1m","fttusdt@kline_1m","arkmusdt@kline_1m"],
            "id": 1
        }))
    }

    //消息监听
    socket.onmessage = function(evt) {
        var data = evt.data

        try {
            data = JSON.parse(data)
        }  catch (error) {
            data = {}
        }

        if (data && data.data && data.data.k) {
            var cl = data.data.k.c
            if (data.stream.includes('btcusdt')) {
                wsObj.btc = parseFloat(cl).toFixed(2)
            }
            if (data.stream.includes('ethusdt')) {
                wsObj.eth = parseFloat(cl).toFixed(2)
            }
            if (data.stream.includes('fttusdt')) {
                wsObj.ftt = parseFloat(cl).toFixed(4)
            }
            if (data.stream.includes('arkmusdt')) {
                wsObj.arkm = parseFloat(cl).toFixed(3)
            }

            window.electronAPI.setTitle(`btc:${wsObj.btc} ftt:${wsObj.ftt} arkm:${wsObj.arkm} eth:${wsObj.eth}`)
        }
    }

    //连接失败
    socket.onerror = function(evt){
        //关闭连接
        socket.close();
        setTimeout(() => {
            connect()
        },2000)

        console.log("onerror " + JSON.stringify(evt));
    }

    //连接关闭
    socket.onclose = function(evt){
        //关闭连接
        setTimeout(() => {
            connect()
        },2000)

        console.log("onclose " + JSON.stringify(evt));
    }

    return socket;
}
