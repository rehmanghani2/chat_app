import Group from "../models/Group.js";
import Message from "../models/Message.js";
import cloudinary from "../lib/cloudinary.js";
import { io, userSocketMap } from "../server.js";

// Create a new Group
export const createGroup = async (req, res) => {
    try {
        const { name, description, groupPic, members } = req.body;
        const adminId = req.user._id;

        if (!name) {
            return res.json({ success: false, message: "Group name is required" });
        }

        let imageUrl = "";
        if (groupPic) {
            const uploadResponse = await cloudinary.uploader.upload(groupPic);
            imageUrl = uploadResponse.secure_url;
        }

        // Ensure current user is in members array
        const memberList = Array.isArray(members) ? members : [];
        if (!memberList.includes(adminId.toString())) {
            memberList.push(adminId.toString());
        }

        const newGroup = await Group.create({
            name,
            description: description || "",
            groupPic: imageUrl,
            adminId,
            admins: [adminId],
            members: memberList
        });

        const populatedGroup = await Group.findById(newGroup._id)
            .populate("members", "fullName email profilePic bio")
            .populate("admins", "fullName email profilePic");

        // Notify member sockets in real time and auto-join socket room
        memberList.forEach((mId) => {
            const memberSocketId = userSocketMap[mId];
            if (memberSocketId) {
                const targetSocket = io.sockets.sockets.get(memberSocketId);
                if (targetSocket) {
                    targetSocket.join(`group_${newGroup._id}`);
                }
                io.to(memberSocketId).emit("addedToGroup", populatedGroup);
            }
        });

        res.json({ success: true, group: populatedGroup });
    } catch (error) {
        console.log("Error in createGroup controller:", error.message);
        res.json({ success: false, message: error.message });
    }
};

// Get all groups for logged-in user
export const getUserGroups = async (req, res) => {
    try {
        const userId = req.user._id;
        const groups = await Group.find({ members: userId })
            .populate("members", "fullName email profilePic bio")
            .populate("admins", "fullName email profilePic")
            .sort({ updatedAt: -1 });

        res.json({ success: true, groups });
    } catch (error) {
        console.log("Error in getUserGroups controller:", error.message);
        res.json({ success: false, message: error.message });
    }
};

// Get all messages for a specific group
export const getGroupMessages = async (req, res) => {
    try {
        const { id: groupId } = req.params;

        const messages = await Message.find({ groupId })
            .populate("senderId", "fullName profilePic")
            .populate("replyTo", "text image audio fileName senderId");

        res.json({ success: true, messages });
    } catch (error) {
        console.log("Error in getGroupMessages controller:", error.message);
        res.json({ success: false, message: error.message });
    }
};

// Send message to group
export const sendGroupMessage = async (req, res) => {
    try {
        const { text, image, audio, fileUrl: existingFileUrl, fileData, fileName, fileType, fileSize, replyTo, isForwarded } = req.body;
        const { id: groupId } = req.params;
        const senderId = req.user._id;

        const group = await Group.findById(groupId);
        if (!group) {
            return res.json({ success: false, message: "Group not found" });
        }

        let imageUrl, audioUrl, fileUrl;

        if (image) {
            if (image.startsWith('http://') || image.startsWith('https://')) {
                imageUrl = image;
            } else {
                const uploadResponse = await cloudinary.uploader.upload(image);
                imageUrl = uploadResponse.secure_url;
            }
        }

        if (audio) {
            if (audio.startsWith('http://') || audio.startsWith('https://')) {
                audioUrl = audio;
            } else {
                const uploadResponse = await cloudinary.uploader.upload(audio, { resource_type: "video" });
                audioUrl = uploadResponse.secure_url;
            }
        }

        if (existingFileUrl) {
            fileUrl = existingFileUrl;
        } else if (fileData) {
            const uploadResponse = await cloudinary.uploader.upload(fileData, { resource_type: "raw" });
            fileUrl = uploadResponse.secure_url;
        }

        let newMessage = await Message.create({
            senderId,
            groupId,
            isGroup: true,
            text,
            image: imageUrl,
            audio: audioUrl,
            fileUrl: fileUrl,
            fileName: fileName || "",
            fileType: fileType || "",
            fileSize: fileSize || "",
            replyTo: replyTo || null,
            delivered: true,
            isForwarded: !!isForwarded
        });

        newMessage = await newMessage.populate("senderId", "fullName profilePic");
        if (replyTo) {
            newMessage = await newMessage.populate("replyTo", "text image audio fileName senderId");
        }

        // Update group updatedAt timestamp
        await Group.findByIdAndUpdate(groupId, { updatedAt: new Date() });

        // Broadcast to group room
        io.to(`group_${groupId}`).emit("newGroupMessage", newMessage);

        res.json({ success: true, newMessage });
    } catch (error) {
        console.log("Error in sendGroupMessage controller:", error.message);
        res.json({ success: false, message: error.message });
    }
};

// Add member to group
export const addMember = async (req, res) => {
    try {
        const { id: groupId } = req.params;
        const { memberId } = req.body;

        const group = await Group.findById(groupId);
        if (!group) {
            return res.json({ success: false, message: "Group not found" });
        }

        if (!group.admins.includes(req.user._id)) {
            return res.json({ success: false, message: "Only group admins can add members" });
        }

        if (!group.members.includes(memberId)) {
            group.members.push(memberId);
            await group.save();
        }

        const updatedGroup = await Group.findById(groupId)
            .populate("members", "fullName email profilePic bio")
            .populate("admins", "fullName email profilePic");

        // Make added member socket join room & emit addedToGroup event
        const memberSocketId = userSocketMap[memberId];
        if (memberSocketId) {
            const targetSocket = io.sockets.sockets.get(memberSocketId);
            if (targetSocket) {
                targetSocket.join(`group_${groupId}`);
            }
            io.to(memberSocketId).emit("addedToGroup", updatedGroup);
        }

        io.to(`group_${groupId}`).emit("groupUpdated", updatedGroup);

        res.json({ success: true, group: updatedGroup });
    } catch (error) {
        console.log("Error in addMember controller:", error.message);
        res.json({ success: false, message: error.message });
    }
};

// Remove member from group
export const removeMember = async (req, res) => {
    try {
        const { id: groupId } = req.params;
        const { memberId } = req.body;

        const group = await Group.findById(groupId);
        if (!group) {
            return res.json({ success: false, message: "Group not found" });
        }

        if (!group.admins.includes(req.user._id) && req.user._id.toString() !== memberId) {
            return res.json({ success: false, message: "Not authorized to remove member" });
        }

        group.members = group.members.filter((m) => m.toString() !== memberId);
        group.admins = group.admins.filter((a) => a.toString() !== memberId);

        await group.save();

        const updatedGroup = await Group.findById(groupId)
            .populate("members", "fullName email profilePic bio")
            .populate("admins", "fullName email profilePic");

        // Make removed member socket leave room & emit removedFromGroup event
        const memberSocketId = userSocketMap[memberId];
        if (memberSocketId) {
            const targetSocket = io.sockets.sockets.get(memberSocketId);
            if (targetSocket) {
                targetSocket.leave(`group_${groupId}`);
            }
            io.to(memberSocketId).emit("removedFromGroup", { groupId });
        }

        io.to(`group_${groupId}`).emit("groupUpdated", updatedGroup);

        res.json({ success: true, group: updatedGroup });
    } catch (error) {
        console.log("Error in removeMember controller:", error.message);
        res.json({ success: false, message: error.message });
    }
};
