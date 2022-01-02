const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { /* options */ });

let randomId = () => {
  return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
}
let rooms = {}
let clientsRooms = {}
let roomsReady = {};
io.on("connection", (socket) => {
  socket.on("newRoom", () => {
    const newRoom = randomId();
    socket.emit("roomCreated", newRoom);
    rooms[newRoom] = [];
    roomsReady[newRoom] = 0;
  })
  socket.on("disconnect", () => {
    if(socket.id in clientsRooms) {
      const room = clientsRooms[socket.id];
      rooms[room].splice(rooms[room].indexOf(socket.id), 1);
      if(rooms[room].length == 0) {
        delete rooms[room];
        delete roomsReady[room];
      }
      delete clientsRooms[socket.id];
    }
  })
  socket.on("joinRoom", ({room, name}) => {
    if(room in rooms && rooms[room].length < 2) {
      socket.join(room);
      rooms[room].push(socket.id)
      clientsRooms[socket.id] = room;
      if(rooms[room].length == 2) {
        io.to(room).emit("start");
      }
    }
  })
  socket.on("ready", () => {
    const room = clientsRooms[socket.id];
    roomsReady[room]++;
    console.log(roomsReady);
    if(roomsReady[room] == 2) {
      io.to(room).emit("ready");
      io.to(rooms[room][0]).emit("play");
    }
  })
});

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/src/html/index.html")
})
app.get("/game/:room/:name", (req, res) => {
  const room = req.param("room");
  const name = req.param("name");
  if(room && name && room in rooms && rooms[room].length < 2) {
    res.sendFile(__dirname + "/src/html/game.html")
  } else {
    res.redirect("/");
  }
})
app.get("/static/*", (req, res) => {
  const split = req.originalUrl.split("static/")[1];
  res.sendFile(__dirname + "/src/" + split);
})

const randomIndex = (arr) => {
  return Math.floor(Math.random() * arr.length);
}

httpServer.listen(80, () => {
  console.log("Listening")
}); 