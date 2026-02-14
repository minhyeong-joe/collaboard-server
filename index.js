import express from 'express';
import cors from 'cors';
import corsConfig from './configs/cors.js';
import dotenv from 'dotenv';
dotenv.config();
import { createServer } from 'http';
import { Server } from 'socket.io';
import { connectSocket } from './socket/index.js';

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

// Initialize Socket.IO connection handlers
connectSocket(io);

const PORT = process.env.PORT || 4000;

httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

