import express from 'express';
import { sendMessage, getMessages, getConversations } from '../controllers/messages.js';

const router = express.Router();

router.post('/messages/send', sendMessage);
router.get('/messages/:wa_id', getMessages);
router.get('/conversations', getConversations);

export default router;