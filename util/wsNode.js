const { SocksProxyAgent } = require("socks-proxy-agent");
const WebSocket = require("ws");

/**
 * 使用nodejs带的包ws连socket（即使退出当前窗口也能继续执行）
 */

let wsObj = { btc: '', eth: '', ftt: '', arkm: '' }
let socket

// 连binance的websocket
function connectWs(callBack){
    console.log('connectWs')

    // 注意：这里不能用socks5，不知道为啥
    // const proxyAgent = new SocksProxyAgent(`socks5://127.0.0.1:7890`);
    const proxyAgent = new SocksProxyAgent(`socks://127.0.0.1:7890`);
    const connect = () => {
        socket = new WebSocket('wss://stream.binance.com:9443/stream?streams=', {
            agent: proxyAgent
        })
    }
    connect() // 连接ws

    //连接成功回调
    socket.onopen = () => {
        console.log("onopen ...");

        // socket.send(JSON.stringify({"method": "SUBSCRIBE","params":["btcusdt@depth5@1000ms","ethusdt@depth5@1000ms","fttusdt@depth5@1000ms","arkmusdt@depth5@1000ms"],"id": 1}))
        socket.send(JSON.stringify({
            "method": "SUBSCRIBE",
            "params":["btcusdt@kline_1m","ethusdt@kline_1m","fttusdt@kline_1m","arkmusdt@kline_1m"],
            "id": 1
        }))
    }

    //消息监听
    socket.onmessage = (evt) => {
        let data = evt.data
        // console.log("onmessage ...", data);

        try {
            data = JSON.parse(data)
        }  catch (error) {
            data = {}
        }

        if (data && data.data && data.data.k) {
            const cl = data.data.k.c
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

            callBack('title', `btc:${wsObj.btc} ftt:${wsObj.ftt} arkm:${wsObj.arkm} eth:${wsObj.eth}`)
        }
    }

    //连接失败
    socket.onerror = function(evt){
        //关闭连接
        socket.close();
        callBack('notify', 'ws连接断开，正在重连...')
        setTimeout(() => {
            callBack('error')
        },2000)

        console.log("onerror " + JSON.stringify(evt));
    }

    // 连接关闭
    socket.onclose = function(evt){
        callBack('notify', 'ws连接断开，正在重连...')
        setTimeout(() => {
            callBack('close')
        },2000)

        console.log("onclose " + JSON.stringify(evt));
    }

    return socket;
}

module.exports = { connectWs }