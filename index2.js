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

  socket.on('setRoomUsername', ({ name, room }) => {
    users[socket.id] = { name, room }
    socket.join(room)
    console.log(`${users[socket.id].name} connected`)
    socket.broadcast.to(room).emit('joinMessage', `${users[socket.id].name} joined`)
    socket.emit('joinMessage', 'You joined')
  })

  // Handle custom event from the client
  socket.on('newMessage', (message) => {
    // Send custom event from server to all the client
    const newMessageDetails = {
      name: users[socket.id].name,
      message: message,
    }
    console.log(newMessageDetails)
    io.to(users[socket.id].room).emit('newMessageToAll', newMessageDetails)
  })

  // Handle client disconnections (event: 'disconnect')
  socket.on('disconnect', () => {
    console.log(`${users[socket.id] && users[socket.id].name} disconnected`)
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
    - Rooms: Group multiple clients together so that they can send messages to each other
    - Server
      - socket.join(room): Joining a specific room
      - socket.emit('event2', message): Send a custom event from the server to a sender client
      - socket.broadcast.to(room).emit('event2', message): Send a custom event from the server to all clients except the sender in the room
      - io.to(room).emit('event2', message): Send a custom event from the server to all the clients in the room
*/