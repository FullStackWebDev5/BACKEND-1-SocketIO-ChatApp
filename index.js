const express = require('express')
const dotenv = require('dotenv')
dotenv.config()
const mongoose = require('mongoose')
const { createServer } = require('http')
const bodyParser = require('body-parser')
const { Server } = require("socket.io")

const app = express()
const server = createServer(app)
const io = new Server(server)

app.use(bodyParser.urlencoded())
app.use(bodyParser.json())
app.use(express.static(__dirname + '/public'))

const connectToDb = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL)
    console.log('Database connected ✅')
  } catch (error) {
    console.log('Database error: ', error)
  }
}
const messageSchema = new mongoose.Schema({
  name: String,
  message: String,
})
const Message = mongoose.model('Message', messageSchema)

const saveMessage = async ({ name, message }) => {
  try {
    await Message.create({ name, message })
    console.log('Message synced')
  } catch (error) {
    console.log('DB Error', error)
  }
}

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
  socket.on('newMessage', async (message) => {
    // Send custom event from server to the sender client
    // socket.emit('serverMsg', 'Your message was received')

    // Send custom event from server to all the client
    const newMessageDetails = {
      name: users[socket.id],
      message: message,
    }
    
    saveMessage(newMessageDetails)
    io.emit('newMessageToAll', newMessageDetails)
  })

  socket.on('startedTyping', () => {
    socket.broadcast.emit('userTyping', users[socket.id])
  })

  socket.on('stoppedTyping', () => {
    socket.broadcast.emit('userStoppedTyping')
  })

  // Handle client disconnections (event: 'disconnect')
  socket.on('disconnect', () => {
    console.log(`${users[socket.id]} disconnected`)
  })
})

server.listen(3000, () => {
  console.log('Server is running at http://localhost:3000')
  connectToDb()
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