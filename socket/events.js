export const EVENTS = {
    CONNECTION: 'connection',
    DISCONNECT: 'disconnect',
    
    // Room
    CREATE_ROOM: 'createRoom',
    JOIN_ROOM: 'joinRoom',      // client emits when joining a room
    LEAVE_ROOM: 'leaveRoom',    // client emits when leaving a room
    USER_JOINED: 'userJoined',      // server broadcasts to room participants when a user joins
    USER_LEFT: 'userLeft',     // server broadcasts to room participants when a user leaves
    ROOM_DELETED: 'roomDeleted',   // server broadcasts to room participants when a room is deleted (e.g. when the creator leaves)

    // Drawing
    CURSOR_MOVE: 'cursorMove',    // client emits when moving cursor
    CURSOR_UPDATE: 'cursorUpdate',  // server broadcasts to room participants when a user moves their cursor
    DRAW: 'draw',   // client emits when drawing
    STROKE_DRAWN: 'strokeDrawn',    // server broadcasts to room participants
    STROKE_DELETE: 'strokeDelete',  // client emits when deleting a stroke
    STROKE_DELETED: 'strokeDeleted', // server broadcasts to room participants
};
