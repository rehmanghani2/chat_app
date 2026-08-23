import Status from "../models/Status.js";
import cloudinary from "../lib/cloudinary.js";

// Create a new status story
export const createStatus = async (req, res) => {
    try {
        const { media, caption } = req.body;
        const userId = req.user._id;

        if (!media) {
            return res.json({ success: false, message: "Media image is required for status" });
        }

        const uploadResponse = await cloudinary.uploader.upload(media);

        const newStatus = await Status.create({
            userId,
            mediaUrl: uploadResponse.secure_url,
            caption: caption || ""
        });

        const populatedStatus = await Status.findById(newStatus._id)
            .populate("userId", "fullName profilePic")
            .populate("viewers.userId", "fullName profilePic");

        res.json({ success: true, status: populatedStatus });
    } catch (error) {
        console.log("Error in createStatus controller:", error.message);
        res.json({ success: false, message: error.message });
    }
};

// Get all unexpired 24h status stories grouped by user
export const getStatuses = async (req, res) => {
    try {
        const statuses = await Status.find()
            .populate("userId", "fullName profilePic")
            .populate("viewers.userId", "fullName profilePic")
            .sort({ createdAt: 1 });

        // Group statuses by user ID
        const groupedStatuses = {};
        statuses.forEach((st) => {
            const uId = st.userId._id.toString();
            if (!groupedStatuses[uId]) {
                groupedStatuses[uId] = {
                    user: st.userId,
                    stories: []
                };
            }
            groupedStatuses[uId].stories.push(st);
        });

        res.json({ success: true, statuses: Object.values(groupedStatuses) });
    } catch (error) {
        console.log("Error in getStatuses controller:", error.message);
        res.json({ success: false, message: error.message });
    }
};

// Record viewing a status story
export const viewStatus = async (req, res) => {
    try {
        const { id: statusId } = req.params;
        const userId = req.user._id;

        const status = await Status.findById(statusId);
        if (!status) {
            return res.json({ success: false, message: "Status story not found" });
        }

        const alreadyViewed = status.viewers.some(
            (v) => v.userId.toString() === userId.toString()
        );

        if (!alreadyViewed) {
            status.viewers.push({ userId, viewedAt: new Date() });
            await status.save();
        }

        const updatedStatus = await Status.findById(statusId)
            .populate("userId", "fullName profilePic")
            .populate("viewers.userId", "fullName profilePic");

        res.json({ success: true, status: updatedStatus });
    } catch (error) {
        console.log("Error in viewStatus controller:", error.message);
        res.json({ success: false, message: error.message });
    }
};
