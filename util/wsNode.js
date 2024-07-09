const { SocksProxyAgent } = require('socks-proxy-agent')
const { pairs } = require('../config/const')
const WebSocket = require('ws')

/**
 * 使用nodejs带的包ws连socket（即使退出当前窗口也能继续执行）
 */
const sufix = 'usdt@kline_1m'
const wsObj = { }
let socket

// 小数位数展示
function fixNum(num, fix = 2) {
    const pow = Math.pow(10, fix)

    return parseInt(num * pow) / pow
}

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

        socket.send(JSON.stringify({
            "method": "SUBSCRIBE",
            "params": pairs,
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

            if (data.stream.includes(sufix)) {
                const coin = data.stream.replace(sufix, '')
                const arrow = wsObj[coin] ? (fixNum(cl, 4) > parseFloat(wsObj[coin]) ? '↑' : '↓') : ''
                wsObj[coin] = `${fixNum(cl, 4)}${arrow}`
            }

            const keys = Object.keys(wsObj)
            const values = Object.values(wsObj)


            callBack('title', keys.map((key, index) => `${key}:${values[index]}`).join('  '))
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
