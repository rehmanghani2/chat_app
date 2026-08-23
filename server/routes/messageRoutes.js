import express from 'express';
import { protectRoute } from '../middleware/auth.js';
import { getMessages, getStreamToken, getUserForSidebar, markMessageAsSeen, reactToMessage, sendMessage } from '../controllers/messageController.js';
import { generateStreamToken } from '../lib/stream.js';

const messageRouter = express.Router();

messageRouter.get("/users", protectRoute, getUserForSidebar);
messageRouter.get("/:id", protectRoute, getMessages);
messageRouter.put("/mark/:id", protectRoute, markMessageAsSeen);
messageRouter.post("/send/:id", protectRoute, sendMessage);
messageRouter.post("/react/:id", protectRoute, reactToMessage);
messageRouter.get("/users/token", protectRoute, getStreamToken);

export default messageRouter;