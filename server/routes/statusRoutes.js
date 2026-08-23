import express from 'express';
import { protectRoute } from '../middleware/auth.js';
import { createStatus, getStatuses, viewStatus } from '../controllers/statusController.js';

const statusRouter = express.Router();

statusRouter.post('/create', protectRoute, createStatus);
statusRouter.get('/list', protectRoute, getStatuses);
statusRouter.post('/view/:id', protectRoute, viewStatus);

export default statusRouter;
