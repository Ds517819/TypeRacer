//http://10.19.107.193:3000


//loads express module and assigns it to a variable called express
const express = require("express");
//to access http server
const http = require("http");
const User = require('./user');
//gets server class from socket.io module
const socketio = require("socket.io");
const Server = socketio.Server;
const app = express();
const server = http.createServer(app);
const io = new Server(server);
server.listen(3000);
//gives people access to public folder
app.use(express.static("public"));





io.on("connection", (socket) => {
    console.log("A user connected " + socket.id);

    socket.on("message", (data) => {
    io.emit("message", data);
    });


  socket.on("setName", (name) => {
    const user = new User(name);
    socket.user = user;
  });


});



//emits message in chat when you type something in the console
process.stdin.on("data", (data) => {
  const words = data.toString().trim().split(" ");


  if(words[0] === "broadcast"){
    io.emit("message", { message: data.toString().substring(9), name: "Server" });
  }
});
