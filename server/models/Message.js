
import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    senderId: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
    receiverId: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: false},
    groupId: {type: mongoose.Schema.Types.ObjectId, ref: "Group", default: null},
    isGroup: {type: Boolean, default: false},
    text: {type: String},
    image: {type: String},
    audio: {type: String},
    fileUrl: {type: String},
    fileName: {type: String},
    fileType: {type: String},
    fileSize: {type: String},
    replyTo: {type: mongoose.Schema.Types.ObjectId, ref: "Message", default: null},
    reactions: [
        {
            userId: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
            emoji: {type: String}
        }
    ],
    delivered: {type: Boolean, default: false},
    seen: {type: Boolean, default: false}
}, {timestamps: true});

const Message = mongoose.model("Message", messageSchema);

export default Message;