import express from "express";
import mongoose from "mongoose";
import dotenv from 'dotenv';
import routes from "./routes/messages.js";
import { createServer } from 'http';
import { Server } from "socket.io";

import cors from 'cors';
dotenv.config();
const app = express();
const port = process.env.PORT || 8000;



app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }))
app.use("/api", routes);

app.get('/', (req, res) => {
    res.json({ message: "Hi there, I'm the root route of the web page" });
})

const connectionDb = await mongoose.connect(process.env.MONGO_URL, {
    dbName: 'whatsapp',
})
console.log("DB connected ", connectionDb.connection.host);

const server = createServer(app);

export const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        methods: ["GET", "POST"],
    },
});

io.on('connection', (socket) => {
    console.log("client connected:", socket.id);


    socket.on("join_room", (roomId) => {
        socket.join(roomId);
        console.log(`joined room: ${roomId}`)
    });

    socket.on('disconnect', () => {
        console.log("client disconnected:", socket.id);
    })
})


server.listen(port, () => {
    console.log(`Server is running on port ${port}`);

})
