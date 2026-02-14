import { EVENTS } from './events.js';

// Store active rooms and their users
const rooms = new Map();

// handle room creation
// emit to creator:
// userJoined (userId, nickname, roomId, users) <- initial room data
const createRoom = (io, socket) => {
    socket.on(EVENTS.CREATE_ROOM, ({ roomId, userId, nickname }, callback) => {
        console.log(`User ${nickname} creating room ${roomId}`);
        // Join the room
        socket.join(roomId);

        // Store room data
        if (!rooms.has(roomId)) {
            rooms.set(roomId, new Map());
        }
        rooms.get(roomId).set(userId, { userId, nickname, socketId: socket.id, isCreator: true });

        console.log(rooms.get(roomId));

        // send initial room data to creator
        callback({
            roomId,
            owner: nickname,
            users: Array.from(rooms.get(roomId).values())
        });
    });
}

// handle user joining a room
// broadcast to room participants:
// userJoined (userId, nickname, roomId, users)
const joinRoom = (io, socket) => {
    socket.on(EVENTS.JOIN_ROOM, ({ roomId, userId, nickname }, callback) => {
        console.log(`User ${nickname} joining room ${roomId}`);

        // Check if room exists
        if (!rooms.has(roomId)) {
            if (callback) {
                callback({ success: false, error: 'Room with given ID does not exist' });
            }
            return;
        }

        // Join the room
        socket.join(roomId);

        // Store user data
        rooms.get(roomId).set(userId, { userId, nickname, socketId: socket.id, isCreator: false });
        const owner = Array.from(rooms.get(roomId).values()).find(user => user.isCreator)?.nickname;

        // Broadcast to everyone in the room that a new user joined
        io.to(roomId).emit(EVENTS.USER_JOINED, { userId, nickname, socketId: socket.id, isCreator: false });

        // send initial room data to the user who just joined
        if (callback) {
            callback({
                success: true,
                data: {
                    roomId,
                    owner,
                    users: Array.from(rooms.get(roomId).values())
                }
            });
        };
    });
}

// handle drawing events
// broadcast to room participants:
// strokeDrawn (stroke, roomId)
const draw = (io, socket) => {
    socket.on(EVENTS.DRAW, ({ roomId, stroke }) => {
        // Broadcast the stroke to everyone else in the room
        socket.to(roomId).emit(EVENTS.STROKE_DRAWN, {
            stroke,
            roomId
        });
    });
}

// handle user leaving a room
// broadcast to room participants:
// roomDeleted
// userLeft (userId, nickname, roomId, users)
const leaveRoom = (io, socket) => {
    socket.on(EVENTS.LEAVE_ROOM, ({ roomId, userId }) => {
        // Leave the room
        socket.leave(roomId);
        // Remove user from room
        if (rooms.has(roomId)) {
            const users = rooms.get(roomId);
            const isCreator = users.get(userId)?.isCreator;
            const nickname = users.get(userId)?.nickname;
            console.log(`User ${nickname} leaving room ${roomId}`);
            users.delete(userId);
            if (users.size === 0 || isCreator) {
                console.log(`Deleting room ${roomId} because the creator left and no users remain`);
                rooms.delete(roomId);
                io.to(roomId).emit(EVENTS.ROOM_DELETED, { roomId });
            } else {
                io.to(roomId).emit(EVENTS.USER_LEFT, { userId, nickname });
            }
        }
    });
};

export { createRoom, joinRoom, draw, leaveRoom };