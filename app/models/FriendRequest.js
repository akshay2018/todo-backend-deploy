const mongoose = require('mongoose')
const Schema = mongoose.Schema

const friendRequestSchema = new Schema({
    senderId: {
        type: String
    },
    recipientId: {
        type: String
    },
    requestStatus: {
        type: String,
        enum: ['requested', 'accepted'],
        required: true
    },

})
friendRequestSchema.index({ senderId: 1, recipientId: 1 }, { unique: true });

module.exports = mongoose.model('FriendRequest', friendRequestSchema)