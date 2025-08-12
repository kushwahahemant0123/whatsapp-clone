import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { PaperPlaneRight } from "@phosphor-icons/react";

const ChatWindow = ({ chat, onBack, socket }) => {



    const [messages, setMessages] = useState([]);
    const [text, setText] = useState("");
    const bottomRef = useRef(null);

    useEffect(() => {
        if (chat?.name) {
            document.title = `${chat.name} - WhatsApp Clone`;
        } else {
            document.title = "WhatsApp Clone";
        }

        // favicon change
        const link = document.querySelector("link[rel~='icon']") || document.createElement("link");
        link.rel = "icon";
        link.href = 'https://upload.wikimedia.org/wikipedia/commons/a/a7/2062095_application_chat_communication_logo_whatsapp_icon.svg';
        document.getElementsByTagName("head")[0].appendChild(link);

        return () => {
            document.title = "WhatsApp Clone"; // reset on unmount
        };
    }, [chat]);



    // scroll helper
    const scrollToBottom = (smooth = true) => {
        bottomRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "end" });
    };

    // dedupe check — supports message_id or _id
    const existsInList = (list, msg) => {
        if (!msg) return false;
        return list.some(m => (m.message_id && msg.message_id && m.message_id === msg.message_id) || (m._id && msg._id && m._id === msg._id));
    };


    const formatDateLabel = (isoString) => {
        const msgDate = new Date(isoString);
        const today = new Date();

        const isToday = msgDate.toDateString() === today.toDateString();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);
        const isYesterday = msgDate.toDateString() === yesterday.toDateString();

        if (isToday) return "Today";
        if (isYesterday) return "Yesterday";
        return msgDate.toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" });
    };

    // fetch history when chat changes
    useEffect(() => {
        if (!chat?.wa_id) return;

        const fetchMessages = async () => {
            try {
                const res = await axios.get(
                    `${import.meta.env.VITE_API_BASE || "http://localhost:8000/api"}/messages/${chat.wa_id}`
                );
                setMessages(res.data || []);
                // ensure we join the socket room after fetching (so server will emit into that room and client is present)
                if (socket && socket.connected) {
                    socket.emit("join_room", chat.wa_id);
                }
                // small delay to let rendering finish
                setTimeout(() => scrollToBottom(false), 50);
            } catch (err) {
                console.error("Error fetching messages:", err);
            }
        };

        fetchMessages();

        // cleanup on chat change — remove any old listeners
        return () => {
            if (socket) {
                socket.off("new_message");
            }
        };
    }, [chat, socket]);

    // socket listener for new messages (attach once per chat)
    useEffect(() => {
        if (!socket || !chat?.wa_id) return;

        const handleNewMessage = (msg) => {
            if (!msg) return;
            // only append messages for this chat
            if (msg.wa_id !== chat.wa_id) return;

            setMessages(prev => {
                if (existsInList(prev, msg)) return prev;
                return [...prev, msg];
            });
            setTimeout(() => scrollToBottom(true), 50);
        };

        socket.on("new_message", handleNewMessage);

        return () => {
            socket.off("new_message", handleNewMessage);
        };
    }, [socket, chat]);

    const sendMessage = async () => {
        if (!text.trim()) return;

        const payload = { wa_id: chat.wa_id, name: chat.name, phone: chat.phone, text };

        try {
            const res = await axios.post(
                `${import.meta.env.VITE_API_BASE || "http://localhost:8000/api"}/messages/send`,
                payload
            );

            const saved = res.data;
            // optimistic append: add response if not already present
            setMessages(prev => {
                if (existsInList(prev, saved)) return prev;
                return [...prev, saved];
            });

            setText("");
            setTimeout(() => scrollToBottom(true), 50);
        } catch (err) {
            console.error("Error sending message:", err);
            // Optionally show user an error / retry UI
        }
    };

    const onKeyPress = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };


    let lastDate = null;

    return (
        <div className="flex flex-col h-full w-full md:w-screen border-l">
            <div className="flex items-center px-4 py-3 bg-gray-100 border-b">
                <button onClick={onBack} className="md:hidden mr-3 text-gray-600">←</button>
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-bold mr-3">
                    {chat.name ? chat.name[0].toUpperCase() : "?"}
                </div>
                <div>
                    <h2 className="font-semibold text-gray-800">{chat.name || chat.phone}</h2>
                    <p className="text-xs text-gray-500">Online</p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-[url('https://web.whatsapp.com/img/bg-chat-tile-dark_a4be8c74.png')] bg-[#e5ddd6]">
                {messages.map((msg) => {
                    const currentDateLabel = formatDateLabel(msg.timestamp);
                    const showDate = currentDateLabel !== lastDate;
                    lastDate = currentDateLabel;

                    return (
                        <React.Fragment key={msg._id || msg.message_id}>
                            {showDate && (
                                <div className="flex justify-center my-3">
                                    <span className="bg-gray-300 text-gray-800 text-xs px-3 py-1 rounded-full">
                                        {currentDateLabel}
                                    </span>
                                </div>
                            )}

                            <div className={`flex mb-3 ${msg.from_me ? "justify-end" : "justify-start"}`}>
                                <div className={`px-4 py-2 rounded-lg shadow-sm max-w-[75%] ${msg.from_me ? "bg-green-100" : "bg-white"}`}>
                                    <div className="text-sm whitespace-pre-wrap">{msg.text}</div>
                                    <div className="flex justify-end items-center mt-1 space-x-2">
                                        <span className="text-xs text-gray-500">
                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                        </span>
                                        {msg.from_me && (
                                            <span className="text-xs">
                                                {String(msg.status).toLowerCase() === "sent" && "✓"}
                                                {String(msg.status).toLowerCase() === "delivered" && "✓✓"}
                                                {String(msg.status).toLowerCase() === "read" && (
                                                    <span className="text-blue-500">✓✓</span>
                                                )}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </React.Fragment>
                    );
                })}
                <div ref={bottomRef} />
            </div>

            <div className="bg-gray-100 px-4 py-3 flex items-center">
                <input
                    type="text"
                    placeholder="Type a message"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={onKeyPress}
                    className="flex-1 px-4 py-2 rounded-full bg-white"
                />
                <button
                    onClick={sendMessage}
                    className="p-2 ml-2 bg-green-500 text-white rounded-full"
                >
                    <PaperPlaneRight size={18} weight="fill" />
                </button>
            </div>
        </div>
    );
};

export default ChatWindow;
