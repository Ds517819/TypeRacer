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
app.use(express.static("public"));
//route
app.get("/publicChat", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});






io.on("connection", (socket) => {
    console.log("A user connected " + socket.handshake.address + " at " + new Date().toLocaleTimeString() + " Current Connections: " + io.engine.clientsCount );

    socket.on("message", (data) => {
     io.emit("message", { text: data, name: socket.user.name });
    });



  socket.on("setName", (name) => {
    socket.user = { name: name, createdAt: new Date() };
    socket.emit("redirect", `/publicChat.html`);
  });

  socket.on("ping", (callback) => {
    callback();
  });

  
});



process.stdin.on("data", (data) => {
  const words = data.toString().trim().split(" ");


  if(words[0] === "broadcast"){
    io.emit("message", { message: data.toString().substring(9), name: "Server" });
  }
});
