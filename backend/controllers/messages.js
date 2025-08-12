import Message from '../models/message.js';
import { io } from '../app.js';


const sendMessage = async (req, res) => {
    try {
        const { wa_id, name, phone, text } = req.body;

        if (!wa_id || !text) {
            return res.status(400).json({ error: "wa_id and text are required" });
        }

        const msg = await Message.create({
            wa_id,
            name,
            phone,
            message_id: `local_${Date.now()}`,
            from_me: true,
            text,
            timestamp: new Date(),
            status: "sent",
            raw: { local: true },
        });

        // Emit ONLY to the room for this wa_id
        io.to(wa_id).emit("new_message", msg);

        // Update conversation list in real time for all clients
        io.emit("conversation_update", {
            _id: wa_id,
            name,
            phone,
            lastMessage: text,
            lastTime: msg.timestamp,
        });

        res.status(201).json(msg);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
};
// 2️⃣ Get all messages for a contact (sorted oldest → newest)
const getMessages = async (req, res) => {
    try {
        const wa_id = req.params.wa_id;
        const messages = await Message.find({ wa_id }).sort({ timestamp: 1 });
        res.json(messages);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

const getConversations = async (req, res) => {
    try {
        const conversations = await Message.aggregate([
            { $sort: { timestamp: -1 } },
            {
                $group: {
                    _id: '$wa_id',
                    name: { $first: '$name' },
                    phone: { $first: '$phone' },
                    lastMessage: { $first: '$text' },
                    lastTime: { $first: '$timestamp' }
                }
            },
            { $sort: { lastTime: -1 } }
        ]);
        res.json(conversations);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

export { sendMessage, getConversations, getMessages };