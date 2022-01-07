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

io.on("connection", (socket) => {
  console.log("new connection")
});

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/src/html/index.html")
})
app.get("/game/:room/:name", (req, res) => {
  res.sendFile(__dirname + "/src/html/game.html")
})
app.get("/static/*", (req, res) => {
  const split = req.originalUrl.split("static/")[1];
  res.sendFile(__dirname + "/src/" + split);
})

const randomIndex = (arr) => {
  return Math.floor(Math.random() * arr.length);
}

httpServer.listen(3000, () => {
  console.log("Listening")
}); 