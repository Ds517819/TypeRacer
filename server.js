//http://10.19.107.193:3000










//loads express module and assigns it to a variable called express
const express = require("express");
//to access http server
const http = require("http");
//gets server class from socket.io module
const socketio = require("socket.io");
const Server = socketio.Server;
const app = express();
const server = http.createServer(app);
const io = new Server(server);
server.listen(3000);
//gives people access to public folder
app.use(express.static(__dirname + "/ClientFiles"));



//route
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/ClientFiles/lobby.html");
});



process.stdin.on("data", (data) => {
  const words = data.toString().trim().split(" ")

  if (words[0] === "broadcast") {
    io.emit("message", { text: data.toString().substring(9), name: "Server" })
  }
})



io.on("connection", (socket) => {
    socket.username = null  // store it on the socket
    console.log("A user connected " + socket.handshake.address + " at " + new Date().toLocaleTimeString() + " Current Connections: " + io.engine.clientsCount);

    socket.on("setName", (username) => {
        socket.username = username
        socket.emit("redirect", `/publicChat.html`)
    })

    socket.on("giveName", (username) => {
        socket.username = username
    })




    socket.on("message", (data) => {
        io.emit("message", { text: data, name: socket.username })
    })

    socket.on("ping", (callback) => {
        callback()
    })
})