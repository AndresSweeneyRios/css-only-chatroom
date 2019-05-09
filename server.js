const express = require('express')
const app = express()
const path = require('path')
const fs = require('fs')

const getFile = async file => fs.readFileSync(path.join(`${__dirname}/client/${file}`))

const connections = []

app.get('/send', async (req,res) => {
    console.log(req.query)
    for (const i of connections)
        i.write(req.query.text)
    res.send('')
})

app.get('/', async (req,res) => {
    connections.push(res)

    res.setHeader('Content-Type', 'text/html')
    res.header('Transfer-encoding', 'chunked')

    // write generic css

    res.write(`
        <style>
        ${await getFile('main.css')}
        </style>
    `)

    res.flushHeaders()

    res.write(`
        <button accesskey="\" class="submit"></button>
    `)

    setInterval(() => {
        res.write('')
    }, 2000)
})

app.get('/main.css', (req,res) => {
    res.sendFile(getFile('main.css'));
})

app.listen('8000')