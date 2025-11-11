const socketEvent = {
    // client events
    JOIN_GROUP: 'join_group',
    LEAVE_GROUP: 'leave_group',
    SEND_GROUP_MESSAGE: 'send_group_message',

    // sv events
    GROUP_JOINED: 'group_joined',
    GROUP_LEFT: 'group_left',
    GROUP_MESSAGE_RECEIVED: 'group_message_received',
    ERROR: 'error'
};

export default socketEvent;
