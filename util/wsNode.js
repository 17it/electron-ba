const { SocksProxyAgent } = require('socks-proxy-agent')
const path = require('path')
const WebSocket = require('ws')
const fs = require('fs')
const { app, net } = require('electron');

/**
 * 使用nodejs带的包ws连socket（即使退出当前窗口也能继续执行）
 */
const reconnectTimeout = 2000 // 尝试重连的时间间隔
let isReconnecting = false // 用于记录当前是否处于重连的状态
const sufix = 'usdt@kline_1m'
const wsObj = { }
let pairs = []
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

// 获取当前时间
function getNowDay() {
    const now = new Date()
    return `${now.getFullYear()}-${now.getMonth()+1}-${now.getDate()}`
}

// 连binance的websocket
function connectWs (callBack) {
    if (isReconnecting) { return }
    isReconnecting = true
    setTimeout(() => {
        isReconnecting = false
        startConnect(callBack)
    }, reconnectTimeout)
}

// 获取当天utc0点时的行情
let loading = false
let openPriceMap = {}
let pricePairs = []
let priceBase = {}
let priceReminds = []
function getTicket() {
    if (loading) { return }

    const url = 'https://api.binance.com/api/v3/ticker/tradingDay?type=MINI&symbols='
    const params = `%5B%22${pricePairs.map(i => i.toUpperCase()).join('%22,%22')}%22%5D`
    loading = true

    const request = net.request(`${url}${params}`)
    request.on('response', (response) => {
        let data = '';

        response.on('data', (chunk) => {
            data += chunk;
        })

        response.on('end', () => {
            try {
                // 将接收到的数据转换为JSON对象
                const json = JSON.parse(data);
                if (json && json.length) {
                    openPriceMap[getNowDay()] = openPriceMap[getNowDay()] || {}
                    json.forEach(item => {
                        openPriceMap[getNowDay()][item.symbol] = fixNum(item.openPrice || 0, 8)
                    })
                }
            } catch (error) {
                console.error('JSON解析失败:', error);
            }

            loading = false
        })
    })
    request.end()
}

function startConnect(callBack){
    const url = path.join(app.getPath('userData'), './config.yaml')

    fs.readFile(url, 'utf8', (err, dataStr) => {
        priceBase = {}
        const conf = JSON.parse(dataStr)
        const options = [].concat(conf.pairs).map(i => {
            const el = i.replace(sufix, '')
            if (el.includes(':')) {
                const arr = el.split(':')
                priceBase[arr[0]] = arr[1]
                return `${arr[0]}${sufix}`
            }
            return `${el}${sufix}`
        })
        pairs = [].concat(options).map(i => i.replace(sufix, ''))
        priceReminds = conf.reminds || []

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
        pricePairs = [].concat(options).map(i => `${i.replace(sufix, '')}usdt`)
        getTicket() // 获取币对当天utc0时的价格

        //连接成功回调
        socket.onopen = () => {
            console.log("onopen ...");

            try {
                socket.send(JSON.stringify({
                    "method": "SUBSCRIBE",
                    "params": options,
                    "id": 1
                }))
            }catch (_) {}
        }

        //消息监听
        socket.onmessage = (evt) => {
            let data = evt.data

            try {
                data = JSON.parse(data)
            }  catch (error) {
                data = {}
            }

            if (data && data.data && data.data.k) {
                const cl = data.data.k.c

                if (data.stream.includes(sufix)) {
                    const coin = data.stream.replace(sufix, '')
                    const lastPrice = wsObj[coin] && wsObj[coin].price
                    const arrow = lastPrice ? (fixNum(cl, 8) > parseFloat(wsObj[coin].price) ? '↑' : '↓') : ''

                    let trend = ''
                    const key = `${(coin+'usdt').toUpperCase()}`
                    if (openPriceMap[getNowDay()] && openPriceMap[getNowDay()][key]) {
                        trend = fixNum((cl / (priceBase[coin] || openPriceMap[getNowDay()][key]) - 1) * 100, 2)
                    } else {
                        getTicket()
                    }

                    const rm = priceReminds.filter(i => i.includes(`${coin}:`))
                    if (rm.length && lastPrice) {
                        rm.forEach(i => {
                            const p = i.split(':')[1]
                            if (p && lastPrice < p && p < cl) {
                                callBack('notify', `${coin}的价格达到${p}`)
                            }
                            if (p && lastPrice > p && p > cl) {
                                callBack('notify', `${coin}的价格跌破${p}`)
                            }
                        })
                    }

                    wsObj[coin] = { price: `${fixNum(cl, 8)}${arrow}`, trend }
                }

                const fun = (x,y) => pairs.indexOf(x) > pairs.indexOf(y) ? 1 : -1
                const keys = Object.keys(wsObj).sort(fun)

                callBack('title', keys.map((key) => `${key}:${wsObj[key].price}`).join('  '), wsObj, pairs)
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
