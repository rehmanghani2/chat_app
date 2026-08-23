import mongoose from "mongoose";

const statusSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    mediaUrl: { type: String, required: true },
    caption: { type: String, default: "" },
    viewers: [
        {
            userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            viewedAt: { type: Date, default: Date.now }
        }
    ],
    createdAt: { type: Date, default: Date.now, expires: 86400 } // Auto-deletes after 24 hours (86,400s)
});

const Status = mongoose.model("Status", statusSchema);
export default Status;
