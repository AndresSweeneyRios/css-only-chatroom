const express = require('express')
const app = express()
const path = require('path')
const fs = require('fs')
const cookies = require('cookie-parser')

app.use(cookies())

const getFile = async file => fs.readFileSync(path.join(`${__dirname}/client/${file}`))

const id = () => Buffer.from(
    Math.floor(Math.random()* 9) + '' + Date.now()
).toString('base64').replace(/\=/g,'')

const connections = {}

const messages = []

const keyboard = res => {
    res.write(`
        <div class="keys">
        <div class="key-row">
    `)

    for (const i of 'qwertyuiop'.split('')) res.write(`
        <button accesskey="${i}" class="${i+res.num}">${i}</button>
    `)

    res.write(`
        </div>
        <div class="key-row">
    `)

    for (const i of 'asdfghjkl'.split('')) res.write(`
        <button accesskey="${i}" class="${i+res.num}">${i}</button>
    `)

    res.write(`
        </div>
        <div class="key-row">
    `)

    for (const i of 'zxcvbnm'.split('')) res.write(`
        <button accesskey="${i}" class="${i+res.num}">${i}</button>
    `)

    res.write(`
        </div>
        <div class="key-row">
        <button accesskey=" " class="spacebar spacebar${res.num}"> </button>
        <button accesskey="enter" class="submit submit${res.num}">Submit</button>
        </div>
        </div>
    `)
}

const inputs = res => {
    let styles = `
        <style>
        .keys${res.num-1}, .log${res.num-1}, .input${res.num-1} {
            display: none !important;
            pointer-events: none !important;
        }
    `

    for (const i of 'abcdefghijklmnopqrstuvwxyz'.split('')) styles += `
        .${i+res.num}:focus, .${i+res.num}:active {
            background-image: url('http://localhost:8000/type?text=${i}&num=${res.num}');
        }
    `

    styles += `
        .spacebar${res.num}:focus, .spacebar${res.num}:active {
            background-image: url('http://localhost:8000/type?text=%20&num=${res.num}'); 
        }

        .submit${res.num}:focus, .submit${res.num}:active {
            background-image: url('http://localhost:8000/submit?num=${res.num}');
        }
    `

    styles += `</style>`

    res.write(styles)
}

const refresh = ({req,res}) => {
    res.num = res.num || 0
    res.num++

    keyboard(res)
    inputs(res)

    res.write(`
        <div class="input input${res.num}">${
            connections[req.cookies.chat_id].input
        }</div>
    `)

    res.write(`
        <div class="log log${res.num}">
    `)

    for (const i of messages) {
        res.write(`
            <span class="message"><span class="username">${i.id}:</span> ${i.message}<br></span>
        `)
    } 

    res.write(`
        </div>
    `)
}

app.get('/type', async (req,res) => {
    const connection = connections[req.cookies.chat_id]
    connection.input += req.query.text

    refresh(connection)

    res.write('')
    res.end()
})

app.get('/submit', async (req,res) => {
    const _id = req.cookies.chat_id
    const connection = connections[_id]

    messages.push({
        id: _id,
        message: connection.input
    })

    if (messages.length > 50) 
        messages.splice(0,1)

    connections[_id].input = ''

    for (const [_id, i] of Object.entries(connections))
        refresh(i)

    res.write('')
    res.end()
})

app.get('/', async (req,res) => {
    let _id = req.cookies.chat_id || id()

    if (!req.cookies.chat_id) {
        res.cookie('chat_id', _id)
        req.cookies.chat_id = _id
    }

    connections[_id] = {
        req,
        res,
        input: ''
    }

    res.setHeader('Content-Type', 'text/html')
    res.header('Transfer-encoding', 'chunked')

    // write generic css

    res.write(`
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
        ${await getFile('main.css')}
        </style>
    `)

    res.flushHeaders()

    refresh({req,res})

    setInterval(() => {
        res.write('')
    }, 2000)
})

app.get('/main.css', (req,res) => {
    res.sendFile(getFile('main.css'))
})

const server = app.listen('8000')
server.keepAliveTimeout = 99999999

console.log('Server listening on port 8000 (\x1b[36mhttp://localhost:8000\x1b[0m)')