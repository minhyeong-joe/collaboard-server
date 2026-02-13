import express from 'express';
import cors from 'cors';
import corsConfig from './configs/cors.js';
import dotenv from 'dotenv';
dotenv.config();
import { createServer } from 'http';
import { Server } from 'socket.io';

// Initialize Express app
const app = express();
app.use(cors(corsConfig));

// Create HTTP server with Express app
const httpServer = createServer(app);

// Attach Socket.IO to the HTTP server
const io = new Server(httpServer, {
    cors: corsConfig
});

app.get('/', (req, res) => {
    res.send('Hello, World!');
});

// socket io connection handling
io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

const PORT = process.env.PORT || 4000;

httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

