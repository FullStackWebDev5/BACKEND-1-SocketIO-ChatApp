const express = require('express')
const { createServer } = require('http')
const bodyParser = require('body-parser')
const { Server } = require("socket.io")

const app = express()
const server = createServer(app)
const io = new Server(server)

app.use(bodyParser.urlencoded())
app.use(bodyParser.json())
app.use(express.static(__dirname + '/public'))

const users = {}

// Handle client connections (event: 'connection')
io.on('connection', (socket) => {
  console.log('A user connected', socket.id)

  socket.on('setUsername', (name) => {
    users[socket.id] = name
    console.log(`${users[socket.id]} connected`)
    socket.broadcast.emit('joinMessage', `${users[socket.id]} joined`)
    socket.emit('joinMessage', 'You joined')
  })

  // Handle custom event from the client
  socket.on('newMessage', (message) => {
    // Send custom event from server to the sender client
    // socket.emit('serverMsg', 'Your message was received')

    // Send custom event from server to all the client
    const newMessageDetails = {
      name: users[socket.id],
      message: message,
    }
    console.log(newMessageDetails)
    io.emit('newMessageToAll', newMessageDetails)
  })

  // Handle client disconnections (event: 'disconnect')
  socket.on('disconnect', () => {
    console.log(`${users[socket.id]} disconnected`)
  })
})

app.get('/', (req, res) => {
  res.send('Hello, World!')
})

server.listen(3000, () => {
  console.log('Server is running at http://localhost:3000')
})


/*
  # Socket Programming
    - Websockets: The WebSocket API makes it possible to open a two-way interactive communication session between the user's browser and a server
      - Reference: https://www.researchgate.net/publication/338553959/figure/fig3/AS:846875599044609@1578922285085/Web-socket-architecture.ppm
    - Socket.io: JavaScript library
      - Server
        - io.on('connection', (socket) => {}): Client connections
        - socket.on('disconnect', () => {}): Client disconnections
        - socket.emit('event2', message): Send a custom event from the server to a sender client
        - socket.broadcast.emit('event2', message): Send a custom event from the server to all clients except the sender
        - io.emit('event2', message): Send a custom event from the server to all the clients
        - socket.on('event1', () => {}): Handle custom event from the client
      - Client
        - const socket = io(): Initiate a client connection
        - socket.emit('event1', message): Send a custom event from the client to the server
        - socket.on('event2', message): Handle custom event from the server

      - Concepts
        - Client to Server
        - Server to Client
        - Client to Server to All Clients

      - NPM: https://www.npmjs.com/package/socket.io
      - Reference Doc: 
        - https://socket.io/
        - https://www.geeksforgeeks.org/introduction-to-sockets-io-in-node-js/
*/