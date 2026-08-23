import Message from "../models/Message.js";
import User from "../models/User.js";
import cloudinary from "../lib/cloudinary.js";
import { io, userSocketMap } from "../server.js";
import { generateStreamToken, upsertStreamUser } from "../lib/stream.js";

// Get all users except the logged in user
export const getUserForSidebar = async (req, res) => {
    try {
        const userId = req.user._id;
        const filteredUsers = await User.find({_id: {$ne: userId}}).select("-password");
        // Count number of messages not seen
        const unseenMessages = {};
        const promises = filteredUsers.map(async (user) =>{
            const messages = await Message.find({senderId: user._id, receiverId: userId, seen: false});
                if(messages.length > 0){
                    unseenMessages[user._id] = messages.length;
                }
        });
        await Promise.all(promises);
        res.json({ success: true, users: filteredUsers, unseenMessages});

    } catch (error) {
        console.log(error.message)
        res.json({success: false, message: error.message});
    }
}

// Get all messages for selected user
export const getMessages = async (req, res) => {
    try {
        const { id: selectedUserId } = req.params;
        const myId = req.user._id;

        const messages = await Message.find({
            $or: [
                { senderId: myId, receiverId: selectedUserId },
                { senderId: selectedUserId, receiverId: myId },
            ]
        }).populate("replyTo", "text image audio fileName senderId");

        // Mark unseen messages from selected user as seen and delivered
        await Message.updateMany(
            { senderId: selectedUserId, receiverId: myId, seen: false },
            { seen: true, delivered: true }
        );

        res.json({ success: true, messages });

    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
}

// API to mark message as seen using message id
export const markMessageAsSeen = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedMessage = await Message.findByIdAndUpdate(id, { seen: true, delivered: true }, { new: true });
        
        const senderSocketId = userSocketMap[updatedMessage?.senderId];
        if (senderSocketId) {
            io.to(senderSocketId).emit("messageSeen", { messageId: id, seen: true });
        }

        res.json({ success: true });

    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
}

// Send message to selected user
export const sendMessage = async (req, res) => {
    try {
        const { text, image, audio, fileData, fileName, fileType, fileSize, replyTo } = req.body;
        const receiverId = req.params.id;
        const senderId = req.user._id;

        let imageUrl, audioUrl, fileUrl;

        if (image) {
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl = uploadResponse.secure_url;
        }

        if (audio) {
            const uploadResponse = await cloudinary.uploader.upload(audio, { resource_type: "video" });
            audioUrl = uploadResponse.secure_url;
        }

        if (fileData) {
            const uploadResponse = await cloudinary.uploader.upload(fileData, { resource_type: "raw" });
            fileUrl = uploadResponse.secure_url;
        }

        // Check if receiver is online to set delivered status
        const receiverSocketId = userSocketMap[receiverId];
        const isDelivered = !!receiverSocketId;

        let newMessage = await Message.create({
            senderId,
            receiverId,
            text,
            image: imageUrl,
            audio: audioUrl,
            fileUrl: fileUrl,
            fileName: fileName || "",
            fileType: fileType || "",
            fileSize: fileSize || "",
            replyTo: replyTo || null,
            delivered: isDelivered
        });

        if (replyTo) {
            newMessage = await newMessage.populate("replyTo", "text image audio fileName senderId");
        }

        // Emit the new Message to receiver's socket
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", newMessage);
        }

        res.json({ success: true, newMessage });

    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
}

// React to a message with an emoji
export const reactToMessage = async (req, res) => {
    try {
        const { id: messageId } = req.params;
        const { emoji } = req.body;
        const userId = req.user._id;

        const message = await Message.findById(messageId);
        if (!message) {
            return res.json({ success: false, message: "Message not found" });
        }

        const existingReactionIndex = message.reactions.findIndex(
            (r) => r.userId.toString() === userId.toString()
        );

        if (existingReactionIndex > -1) {
            if (message.reactions[existingReactionIndex].emoji === emoji) {
                // Remove reaction if user clicks same emoji
                message.reactions.splice(existingReactionIndex, 1);
            } else {
                // Update emoji
                message.reactions[existingReactionIndex].emoji = emoji;
            }
        } else {
            // Add new reaction
            message.reactions.push({ userId, emoji });
        }

        await message.save();
        await message.populate("replyTo", "text image audio fileName senderId");

        // Notify both sender and receiver sockets about reaction update
        const receiverSocketId = userSocketMap[message.receiverId];
        const senderSocketId = userSocketMap[message.senderId];

        const payload = { messageId: message._id, reactions: message.reactions };
        if (receiverSocketId) io.to(receiverSocketId).emit("messageReaction", payload);
        if (senderSocketId) io.to(senderSocketId).emit("messageReaction", payload);

        res.json({ success: true, message });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
}

export const getStreamToken = async (req, res) => {
    try {
        if (req.user) {
            await upsertStreamUser({
                id: req.user._id.toString(),
                name: req.user.fullName,
                image: req.user.profilePic || ""
            });
        }
        const streamToken = generateStreamToken(req.user._id);
        console.log("Stream Token in getStreamToken(req,res): ", streamToken);
        res.status(200).json({ success: true, streamToken });
    } catch (error) {
        console.log("Error in getStreamToken controller:", error.message);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};