import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Message from '../models/message.js';
import { fileURLToPath } from 'url';


// Fix __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });


// Path to payloads folder (must be in same folder as this script)
const PAYLOAD_DIR = path.join(__dirname, '../payloads');

// MongoDB connection
const connect = async () => {
    await mongoose.connect(process.env.MONGO_URL, {
        dbName: 'whatsapp',
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected');
};

// Parse WhatsApp timestamp (seconds → Date)
const parseTimeStamp = (ts) => {
    return new Date(Number(ts) * 1000);
};

// Insert new message into DB
async function insertMessage(values) {
    const contact = values.contacts?.[0];
    const message = values.messages?.[0];

    if (!contact || !message) {
        console.warn('Skipping message — missing contact or message data');
        return;
    }

    const from_me = message.from !== contact.wa_id;

    const doc = {
        wa_id: contact.wa_id,
        name: contact.profile?.name || null,
        phone: contact.wa_id,
        message_id: message.id,
        meta_msg_id: message.id,
        from_me,
        text: message.text?.body || '',
        timestamp: parseTimeStamp(message.timestamp),
        status: 'sent',
        raw: message
    };

    await Message.updateOne(
        { message_id: doc.message_id },
        { $setOnInsert: doc },
        { upsert: true }
    );

    console.log(`Inserted message: "${doc.text}"`);
}

// Update message status
async function updateStatus(values) {
    const status = values.statuses?.[0];
    if (!status) {
        console.warn('Skipping status update — missing status data');
        return;
    }

    const query = status.id
        ? { message_id: status.id }
        : { meta_msg_id: status.meta_msg_id };

    await Message.updateMany(query, { $set: { status: status.status } });
    console.log(`🔄 Updated ${status.id || status.meta_msg_id} → ${status.status}`);
}

// Process a single payload file
async function processFile(file) {
    try {
        const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
        const value = data?.metaData?.entry?.[0]?.changes?.[0]?.value;

        if (!value) {
            console.warn(`Skipped ${path.basename(file)} — no valid value found`);
            return;
        }

        if (value.messages) {
            await insertMessage(value);
        } else if (value.statuses) {
            await updateStatus(value);
        } else {
            console.warn(`Skipped ${path.basename(file)} — unrecognized format`);
        }
    } catch (err) {
        console.error(`Error processing ${file}:`, err.message);
    }
}

// Main script runner
async function main() {
    await connect();

    if (!fs.existsSync(PAYLOAD_DIR)) {
        console.error(`Payloads folder not found: ${PAYLOAD_DIR}`);
        mongoose.disconnect();
        return;
    }

    const files = fs.readdirSync(PAYLOAD_DIR).filter(f => f.endsWith('.json'));

    if (files.length === 0) {
        console.warn('No JSON files found in payloads folder');
        mongoose.disconnect();
        return;
    }

    for (const file of files) {
        await processFile(path.join(PAYLOAD_DIR, file));
    }

    console.log('Processing complete');
    mongoose.disconnect();
}

// Start script
main().catch(err => {
    console.error('Script failed:', err);
    mongoose.disconnect();
});
