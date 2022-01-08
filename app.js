const express = require("express");
const req = require("express/lib/request");
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
            const socketId = socket.id;
            if(!(roomId in rooms)) {
                rooms[roomId] = {
                    "players": [],
                    "ships": {},
                    "ready": 0,
                    "turn": 0
                }
            }
            rooms[roomId]["players"].push(socket.id);
            rooms[roomId]["ships"][socketId] = [];
            socket.emit("joined", reserved[userId]);
            socket.join(roomId);
            delete reserved[userId];
            if(rooms[roomId]["players"].length == 2) {
                io.to(roomId).emit("startBuilding");
            }
        }
    })
    socket.on("newShip", ({ships, roomId}) => {
        for(let a = 0; a < ships.length; a++) {
            rooms[roomId]["ships"][socket.id].push(ships[a]);
        }
    })
    socket.on("shipsPlaced", roomId => {
        rooms[roomId]["ready"]++;
        if(rooms[roomId]["ready"] == 2) {
            io.to(roomId).emit("start");
            io.to(rooms[roomId]["players"][0]).emit("turn")
        }
    });
    socket.on("shoot", ({cell, roomId}) => {
        const room = rooms[roomId];
        const turn = room["turn"];
        let target = room["players"][0];
        if(turn == 0) target = room["players"][1];
        const hit = room["ships"][target].indexOf(cell) > -1
        if(hit) {
            rooms[roomId]["ships"][target].splice(rooms[roomId]["ships"][target].indexOf(cell), 1)
        }
        socket.emit("hitFeedback", hit);
        if(room["ships"][target].length == 0) {
            socket.emit("won");
            for(let a = 0; a < room["players"].length; a++) {
                const player = room["players"][a];
                if(player != socket.id) {
                    io.to(player).emit("lost");
                }
            }
        }
    });
    socket.on("changeTurns", roomId => {
        if(rooms[roomId]["turn"] == 1) {
            rooms[roomId]["turn"] = 0;
        } else {
            rooms[roomId]["turn"] = 1;
        }
        io.to(rooms[roomId]["players"][rooms[roomId]["turn"]]).emit("turn");
    });
});

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/src/html/index.html")
})
app.get("/join/:room", (req, res) => {
    if(req.params.room in rooms) {
        res.sendFile(__dirname + "/src/html/join.html");
    } else {
        res.redirect("/");
    }
});
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

httpServer.listen(3030, () => {
    console.log("Listening")
}); 