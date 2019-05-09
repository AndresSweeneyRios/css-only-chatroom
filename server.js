const express = require('express')
const app = express()
const path = require('path')
const fs = require('fs')

const getFile = async file => fs.readFileSync(path.join(`${__dirname}/client/${file}`))

const connections = []

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
        <button accesskey=" " class="spacebar"> </button>
        </div>
        </div>
    `)
}

app.get('/send', async (req,res) => {
    for (const i of connections){
        refresh(i)
        i.write(req.query.text)
    }

    res.write('')
    res.end()
})

const inputs = res => {
    let styles = `
        <style>
        .keys${res.num-1} {
            display: none !important;
            pointer-events: none !important;
        }
    `

    for (const i of 'abcdefghijklmnopqrstuvwxyz'.split('')) styles += `
        .${i+res.num}:focus, .${i+res.num}:active {
            background-image: url('http://localhost:8000/send?text=${i}&=${res.num}');
        }
    `

    styles += `
        .spacebar:focus, .spacebar:active {
            background-image: url('http://localhost:8000/send?text=%20');
        }
    `

    styles += `</style>`

    res.write(styles)
}

const refresh = res => {
    res.num = res.num || 0
    res.num++

    keyboard(res)
    inputs(res)
}

app.get('/', async (req,res) => {
    connections.push(res)

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

    refresh(res)

    setInterval(() => {
        res.write('')
    }, 2000)
})

app.get('/main.css', (req,res) => {
    res.sendFile(getFile('main.css'));
})

const server = app.listen('8000')
server.keepAliveTimeout = 99999999