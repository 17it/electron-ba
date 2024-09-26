const { SocksProxyAgent } = require('socks-proxy-agent')
const path = require('path')
const WebSocket = require('ws')
const fs = require('fs')
const { app } = require('electron');

/**
 * 使用nodejs带的包ws连socket（即使退出当前窗口也能继续执行）
 */
const sufix = 'usdt@kline_1m'
const wsObj = { }
let socket

// 获取小数点后不为0的位数
function getDecimalPlaces(num) {
    const numStr = num.toString();
    const parts = numStr.split('.');
    if (parts.length <= 1) {
        return 0
    }

    let decimalPart = parts[1].replace(/0*$/, '');
    return decimalPart ? decimalPart.length : 0;
}

// 小数位数展示
function fixNum(num, fix = 2) {
    fix = Math.min(getDecimalPlaces(num), fix)
    const pow = Math.pow(10, fix)

    return parseInt(num * pow) / pow
}

// 连binance的websocket
function connectWs(callBack){
    const url = path.join(app.getPath('userData'), './config.yaml')

    fs.readFile(url, 'utf8', (err, dataStr) => {
        const conf = JSON.parse(dataStr)
        const connect = () => {
            let opt = {}
            if (conf.socks) { // 配置代理
                // 注意：这里不能用socks5，不知道为啥
                const proxyAgent = new SocksProxyAgent(conf.socks.replace('socks5', 'socks'));
                opt = { agent: proxyAgent }
            }
            socket = new WebSocket('wss://stream.binance.com:9443/stream?streams=', opt)
        }
        connect() // 连接ws

        //连接成功回调
        socket.onopen = () => {
            console.log("onopen ...");

            socket.send(JSON.stringify({
                "method": "SUBSCRIBE",
                "params": conf.pairs,
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
                    const arrow = wsObj[coin] ? (fixNum(cl, 8) > parseFloat(wsObj[coin]) ? '↑' : '↓') : ''
                    wsObj[coin] = `${fixNum(cl, 8)}${arrow}`
                }

                const keys = Object.keys(wsObj)
                const values = Object.values(wsObj)


                callBack('title', keys.map((key, index) => `${key}:${values[index]}`).join('  '), wsObj)
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
    })
}

module.exports = { connectWs }
