import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    wa_id: { type: String, required: true },
    name: { type: String },
    phone: { type: String },
    message_id: { type: String, required: true },
    meta_msg_id: { type: String },
    from_me: { type: Boolean, default: false },
    text: { type: String },
    timestamp: { type: Date, default: Date.now },
    status: { type: String, enum: ['sent', 'delivered', 'read', 'unknown'], default: 'sent' },
    raw: { type: Object }
}, {
    collection: 'processed_messages'
})

messageSchema.index({ wa_id: 1, message_id: 1 }, { unique: true });

const Message = mongoose.model('Message', messageSchema);

export default Message;


