const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const path = require('path');

app.use(express.static(path.join(__dirname, 'public'))); // serves frontend

const roomUsers = {};

io.on('connection', socket => {
  socket.on('join', room => {
    socket.join(room);
    roomUsers[room] = roomUsers[room] || 0;
    roomUsers[room]++;
    console.log(`User joined ${room} (${roomUsers[room]} total)`);

    if (roomUsers[room] >= 2) {
      io.in(room).emit('ready'); // notify both clients
    }

    socket.emit('joined');
  });
  socket.on('disconnect', () => {
    for (const room of socket.rooms){
      if (room != socket.id && roomUsers[room]) {
        roomUsers[room]--;
        console.log(`User left ${room} (${roomUsers[room]} remaining)`);
        if (roomUsers[room] <= 0) {
          delete roomUsers[room]; // clean up empty rooms
        }
      }
    }
  });

  socket.on('offer', data => {
    socket.to(data.room).emit('offer', data.sdp);
  });

  socket.on('answer', data => {
    socket.to(data.room).emit('answer', data.sdp);
  });

  socket.on('ice-candidate', data => {
    socket.to(data.room).emit('ice-candidate', data.candidate);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Vital Go running at http://localhost:${PORT}`);
});