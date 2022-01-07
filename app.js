const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { /* options */ });


const reserved = {};
const rooms = {};

io.on("connection", (socket) => {
    socket.on("reserve", username => {
        reserved[socket.id] = username;
        socket.emit("reserved", socket.id);
    })
    socket.on("join", ({roomId, userId}) => {
        if(userId in reserved) {
            if(!(roomId in rooms)) {
                rooms[roomId] = {
                    "players": [],
                    "ships": {}
                }
            } else {
                rooms[roomId]["players"].push(socket.id);
            }
            socket.emit("joined", reserved[userId]);
            delete reserved[userId];
        }
    })
});

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/src/html/index.html")
})
app.get("/game/:room/:id", (req, res) => {
    if(req.params.id in reserved) {
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

httpServer.listen(3000, () => {
    console.log("Listening")
}); 