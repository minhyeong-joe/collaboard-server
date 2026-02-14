import { EVENTS } from './events.js';
import { createRoom, joinRoom, draw, leaveRoom } from './handlers.js';

export const connectSocket = (io) => {
    io.on(EVENTS.CONNECTION, (socket) => {
        console.log('A user connected:', socket.id);
        
        // Register all event handlers for this socket
        createRoom(io, socket);
        joinRoom(io, socket);
        draw(io, socket);
        leaveRoom(io, socket);

        socket.on('disconnect', () => {
            console.log('A user disconnected:', socket.id);
        });
    });

    return io;
};
