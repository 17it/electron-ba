const { SocksProxyAgent } = require("socks-proxy-agent");
const WebSocket = require("ws");

/**
 * 使用nodejs带的包ws连socket（即使退出当前窗口也能继续执行）
 */

let wsObj = { btc: '', eth: '', ftt: '', arkm: '' }

// 连binance的websocket
function connectWs(cb){
    console.log('connectWs')
    // 注意：这里不能用socks5，不知道为啥
    // const proxyAgent = new SocksProxyAgent(`socks5://127.0.0.1:7890`);
    const proxyAgent = new SocksProxyAgent(`socks://127.0.0.1:7890`);
    const socket = new WebSocket('wss://stream.binance.com:9443/stream?streams=', {
        agent: proxyAgent
    })

    //连接成功回调
    socket.onopen = (evt) => {
        console.log("onopen ...");
        socket.send(JSON.stringify({"method": "SUBSCRIBE","params":["btcusdt@depth5@1000ms","ethusdt@depth5@1000ms","fttusdt@depth5@1000ms","arkmusdt@depth5@1000ms"],"id": 1}))
    }

    //消息监听
    socket.onmessage = (evt) => {
        let data = evt.data
        console.log("onmessage ...", data);

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

            cb(`btc:${wsObj.btc} ftt:${wsObj.ftt} arkm:${wsObj.arkm} eth:${wsObj.eth}`)
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

module.exports = { connectWs }
