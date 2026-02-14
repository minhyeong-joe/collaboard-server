import { EVENTS } from './events.js';

// Store active rooms with their users and stroke history
// Structure: { roomId: { users: Map, strokes: [] } }
const rooms = new Map();

// handle room creation
// emit to creator:
// userJoined (userId, nickname, roomId, users) <- initial room data
const createRoom = (io, socket) => {
    socket.on(EVENTS.CREATE_ROOM, ({ roomId, userId, nickname }, callback) => {
        console.log(`User ${nickname} creating room ${roomId}`);
        // Join the room
        socket.join(roomId);

        // Store room data with users and stroke history
        if (!rooms.has(roomId)) {
            rooms.set(roomId, {
                users: new Map(),
                strokes: []
            });
        }
        rooms.get(roomId).users.set(userId, { userId, nickname, socketId: socket.id, isCreator: true });

        console.log(rooms.get(roomId).users);

        // send initial room data to creator
        callback({
            roomId,
            owner: nickname,
            users: Array.from(rooms.get(roomId).users.values()),
            strokes: [] // Empty for creator
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

        const room = rooms.get(roomId);
        
        // Store user data
        room.users.set(userId, { userId, nickname, socketId: socket.id, isCreator: false });
        const owner = Array.from(room.users.values()).find(user => user.isCreator)?.nickname;

        // Broadcast to everyone in the room that a new user joined
        io.to(roomId).emit(EVENTS.USER_JOINED, { userId, nickname, socketId: socket.id, isCreator: false });

        // send initial room data INCLUDING stroke history to the user who just joined
        if (callback) {
            callback({
                success: true,
                data: {
                    roomId,
                    owner,
                    users: Array.from(room.users.values()),
                    strokes: room.strokes // Send complete stroke history
                }
            });
        };
    });
}

// user leaving a room
// broadcast to room participants:
// roomDeleted
// userLeft (userId, nickname, roomId, users)
const leaveRoom = (io, socket) => {
    socket.on(EVENTS.LEAVE_ROOM, ({ roomId, userId }) => {
        // Leave the room
        socket.leave(roomId);
        // Remove user from room
        if (rooms.has(roomId)) {
            const room = rooms.get(roomId);
            const isCreator = room.users.get(userId)?.isCreator;
            const nickname = room.users.get(userId)?.nickname;
            console.log(`User ${nickname} leaving room ${roomId}`);
            room.users.delete(userId);
            if (room.users.size === 0 || isCreator) {
                console.log(`Deleting room ${roomId} because the creator left and no users remain`);
                rooms.delete(roomId);
                io.to(roomId).emit(EVENTS.ROOM_DELETED, { roomId });
            } else {
                io.to(roomId).emit(EVENTS.USER_LEFT, { userId, nickname });
            }
        }
    });
};

// handle user moving cursor
// broadcast to room participants:
// cursorUpdate (userId, x, y, roomId)
const moveCursor = (io, socket) => {
    socket.on(EVENTS.CURSOR_MOVE, ({ roomId, userId, nickname, point: {x, y} }) => {
        console.log(`User ${nickname} moved cursor in room ${roomId} to (${x}, ${y})`);
        // Broadcast the cursor position to everyone else in the room
        socket.to(roomId).emit(EVENTS.CURSOR_UPDATE, { nickname, point: {x, y} });
    });
};

// handle drawing events
// broadcast to room participants:
// strokeDrawn (stroke, roomId)
// Save stroke to room history
// Broadcast the stroke to everyone else in the room
const draw = (io, socket) => {
    socket.on(EVENTS.DRAW, ({ roomId, stroke }) => {
        if (rooms.has(roomId)) {
            rooms.get(roomId).strokes.push(stroke);
        }
        socket.to(roomId).emit(EVENTS.STROKE_DRAWN, {
            stroke,
            roomId
        });
    });
}

const deleteStroke = (io, socket) => {
    socket.on(EVENTS.STROKE_DELETE, ({ roomId, strokeId, userId }) => {
        if (rooms.has(roomId)) {
            const room = rooms.get(roomId);
            const isCreator = room.users.get(userId)?.isCreator;
            
            if (strokeId === 'all') {
                if (isCreator) {
                    // Creator can delete all strokes
                    room.strokes = [];
                    io.to(roomId).emit(EVENTS.STROKE_DELETED, { strokes: [], roomId });
                } else {
                    // Regular user can only delete their own strokes
                    room.strokes = room.strokes.filter(stroke => stroke.userId !== userId);
                    io.to(roomId).emit(EVENTS.STROKE_DELETED, { strokes: room.strokes, userId, roomId });
                }
            } else {
                const strokeIndex = room.strokes.findIndex(stroke => stroke.id === strokeId);
                if (strokeIndex !== -1) {
                    if (room.strokes[strokeIndex].userId === userId || isCreator) {
                        room.strokes.splice(strokeIndex, 1);
                        io.to(roomId).emit(EVENTS.STROKE_DELETED, { strokeId, roomId });
                    }
                }
            }
        }
    });
};

export { createRoom, joinRoom, draw, leaveRoom, moveCursor, deleteStroke };