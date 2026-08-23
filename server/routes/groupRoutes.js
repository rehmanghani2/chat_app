import express from 'express';
import { protectRoute } from '../middleware/auth.js';
import {
    createGroup,
    getUserGroups,
    getGroupMessages,
    sendGroupMessage,
    addMember,
    removeMember
} from '../controllers/groupController.js';

const groupRouter = express.Router();

groupRouter.post('/', protectRoute, createGroup);
groupRouter.get('/', protectRoute, getUserGroups);
groupRouter.get('/:id', protectRoute, getGroupMessages);
groupRouter.post('/send/:id', protectRoute, sendGroupMessage);
groupRouter.put('/add-member/:id', protectRoute, addMember);
groupRouter.put('/remove-member/:id', protectRoute, removeMember);

export default groupRouter;
