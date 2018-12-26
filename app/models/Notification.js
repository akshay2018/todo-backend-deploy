const mongoose = require('mongoose')
const Schema = mongoose.Schema

const notificationSchema = new Schema({
    notiId: {
        type: String,
        required: true,
        index: true,
        unique: true
    },
    senderId: {
        type: String,
        required: true
    },
    recipientId: {
        type: String,
        required: true
    },
    profileId: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['requested', 'accepted', 'createList', 'editList', 'deleteList', 'undoList', 'createItem', 'editItem', 'deleteItem', 'completeItem', 'openItem'],
        required: true
    },
    seen: {
        type: Boolean,
        default: false
    },
    createdOn: {
        type: Date,
        default: Date.now()
    }
})

module.exports = mongoose.model('Notification', notificationSchema)