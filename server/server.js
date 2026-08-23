import express from "express";
import "dotenv/config";
import cors from 'cors';
import http from "http";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import { Server } from "socket.io";

import groupRouter from "./routes/groupRoutes.js";
import statusRouter from "./routes/statusRoutes.js";

// Create Express app
const app = express();

// Store online users and Socket.IO reference
export const userSocketMap = {}; // {userId: socketId}
export let io = null;
export let server = null;

// Only initialize Socket.io & HTTP TCP server in standard Node.js environments (Render, Railway, Local)
try {
    if (typeof http.createServer === 'function' && process.env.CF_PAGES !== '1' && !process.env.WORKERS) {
        server = http.createServer(app);
        io = new Server(server, {
            cors: { origin: "*" }
        });

        io.on("connection", (socket) => {
            const userId = socket.handshake.query.userId;
            console.log("User connected", userId);

            if (userId) userSocketMap[userId] = socket.id;
            io.emit("getOnlineUsers", Object.keys(userSocketMap));

            socket.on("typing", ({ to }) => {
                const receiverSocketId = userSocketMap[to];
                if (receiverSocketId && io) {
                    io.to(receiverSocketId).emit("userTyping", { from: userId });
                }
            });

            socket.on("stopTyping", ({ to }) => {
                const receiverSocketId = userSocketMap[to];
                if (receiverSocketId && io) {
                    io.to(receiverSocketId).emit("userStopTyping", { from: userId });
                }
            });

            // Group Socket Room listeners
            socket.on("joinGroup", ({ groupId }) => {
                socket.join(`group_${groupId}`);
            });

            socket.on("leaveGroup", ({ groupId }) => {
                socket.leave(`group_${groupId}`);
            });

            socket.on("groupTyping", ({ groupId }) => {
                socket.to(`group_${groupId}`).emit("userGroupTyping", { groupId, userId });
            });

            socket.on("groupStopTyping", ({ groupId }) => {
                socket.to(`group_${groupId}`).emit("userGroupStopTyping", { groupId, userId });
            });

            // Call Signaling listeners
            socket.on("startCall", ({ to, callId, isVideo, callerName, callerPic }) => {
                const receiverSocketId = userSocketMap[to];
                if (receiverSocketId && io) {
                    io.to(receiverSocketId).emit("incomingCall", {
                        from: userId,
                        callerName,
                        callerPic,
                        callId,
                        isVideo
                    });
                }
            });

            socket.on("rejectCall", ({ to, callId }) => {
                const callerSocketId = userSocketMap[to];
                if (callerSocketId && io) {
                    io.to(callerSocketId).emit("callRejected", { callId });
                }
            });

            socket.on("acceptCall", ({ to, callId }) => {
                const callerSocketId = userSocketMap[to];
                if (callerSocketId && io) {
                    io.to(callerSocketId).emit("callAccepted", { callId });
                }
            });

            socket.on("endCall", ({ to, callId }) => {
                const targetSocketId = userSocketMap[to];
                if (targetSocketId && io) {
                    io.to(targetSocketId).emit("callEnded", { callId });
                } else if (io) {
                    socket.broadcast.emit("callEnded", { callId });
                }
            });

            socket.on("disconnect", () => {
                console.log("User disconnected", userId);
                delete userSocketMap[userId];
                if (io) io.emit("getOnlineUsers", Object.keys(userSocketMap));
            });
        });
    }
} catch (e) {
    console.warn("Socket.IO setup bypassed for Cloudflare Workers edge environment:", e.message);
}

// Middleware setup
app.use(express.json({limit: "50mb"})); 
app.use(express.urlencoded({limit: "50mb", extended: true}));
app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true
}));

// Auto-Connect DB on incoming request for Serverless / Local
app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (err) {
        console.error("Database connection middleware error:", err);
        next();
    }
});

// Health Check Status Route
app.get("/", (req, res) => {
    res.json({
        status: "online",
        message: "QuickChat Backend Server is running smoothly! 🚀",
        timestamp: new Date().toISOString()
    });
});

app.get("/api/health", (req, res) => {
    res.status(200).json({
        status: "healthy",
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || "development"
    });
});

// Routes setup
app.use("/api/status", statusRouter);
app.use("/api/auth", userRouter);
app.use('/api/messages', messageRouter);
app.use('/api/groups', groupRouter);

// Global Error Handler
app.use((err, req, res, next) => {
    console.error("Server Error:", err);
    res.status(500).json({
        success: false,
        message: err.message || "Internal Server Error"
    });
});

// Only start TCP listener when NOT running inside Vercel or Cloudflare serverless environments
const isServerless = process.env.VERCEL === '1' || process.env.VERCEL_ENV || process.env.CF_PAGES || process.env.WORKERS;
if (!isServerless && server && typeof server.listen === 'function') {
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => console.log("Server is running on PORT: " + PORT));
}

// Cloudflare Workers fetch event handler compatibility
app.fetch = async (request, env, ctx) => {
    return new Promise((resolve) => {
        const res = {
            statusCode: 200,
            headers: {},
            setHeader(k, v) { this.headers[k] = v; },
            getHeader(k) { return this.headers[k]; },
            status(code) { this.statusCode = code; return this; },
            json(data) {
                resolve(new Response(JSON.stringify(data), {
                    status: this.statusCode,
                    headers: { 'Content-Type': 'application/json', ...this.headers }
                }));
            },
            send(data) {
                resolve(new Response(data, {
                    status: this.statusCode,
                    headers: this.headers
                }));
            },
            end(data) {
                resolve(new Response(data || '', {
                    status: this.statusCode,
                    headers: this.headers
                }));
            }
        };
        app(request, res);
    });
};

// Export app for Vercel / Cloudflare serverless deployments
export default app;