// server.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files (HTML, JavaScript, PDF)
app.use(express.static("public"));

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("pageChange", (pageNum) => {
    // Broadcast page change to all connected students
    socket.broadcast.emit("pageUpdate", pageNum);
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

// Server listens on port 5000
server.listen(5000, () => {
  console.log("Server is running on http://localhost:5000");
});
