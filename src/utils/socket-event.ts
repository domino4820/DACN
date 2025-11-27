const socketEvent = {
    // client events
    JOIN_GROUP: 'join_group',
    SEND_GROUP_MESSAGE: 'send_group_message',
    SEND_GROUP_MESSAGE_REPLY: 'send_group_message_reply',

    // sv events
    GROUP_MESSAGE_RECEIVED: 'group_message_received',
    GROUP_MESSAGE_REPLY_RECEIVED: 'group_message_reply_received',
    ERROR: 'error'
};

export default socketEvent;
