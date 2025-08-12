import React, { useEffect, useState } from "react";
import axios from "axios";

const Sidebar = ({ onSelectConversation, collapsed, setCollapsed }) => {
    const [conversations, setConversations] = useState([]);

    useEffect(() => {
        const fetchConversations = async () => {
            try {
                const res = await axios.get(
                    `${import.meta.env.VITE_API_BASE || "http://localhost:8000/api"}/conversations`
                );
                setConversations(res.data);
            } catch (err) {
                console.error("Error fetching conversations:", err);
            }
        };
        fetchConversations();
    }, []);

    const formatTime = (isoString) => {
        if (!isoString) return "";
        const date = new Date(isoString);
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    };

    const truncate = (text, maxLength = 40) => {
        if (!text) return "";
        return text.length > maxLength ? text.substring(0, maxLength) + "…" : text;
    };



    return (
        <aside
            className={`${collapsed ? "hidden md:flex" : "flex"
                } flex-col w-full md:w-80 border-r bg-[#EAEDED]`}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b bg-white">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#25D366] flex items-center justify-center text-white font-bold">
                        W
                    </div>
                    <div className="text-sm font-semibold text-[#075E54]">
                        WhatsApp Clone
                    </div>
                </div>

                {/* Collapse button for mobile */}
                <button
                    className="block md:hidden text-gray-600"
                    onClick={() => setCollapsed((c) => !c)}
                    aria-label="toggle sidebar"
                >
                    ☰
                </button>
            </div>

            <div className="overflow-y-auto">
                {conversations.length === 0 && (
                    <div className="p-4 text-sm text-gray-500">No conversations yet</div>
                )}

                {conversations.map((conv) => (
                    <button
                        key={conv._id}
                        onClick={() =>
                            onSelectConversation(conv._id, conv.name, conv.phone)
                        }
                        className="w-full text-left flex items-center px-4 py-3 hover:bg-[#D1E8E2] border-b border-gray-200"
                    >
                        <div className="w-12 h-12 rounded-full bg-[#25D366] flex items-center justify-center text-white font-bold mr-3 flex-shrink-0">
                            {conv.name
                                ? conv.name[0].toUpperCase()
                                : conv._id?.[0] || "?"}
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center">
                                <div className="text-sm font-semibold text-[#075E54] truncate">
                                    {conv.name || conv.phone}
                                </div>
                                <div className="text-xs text-gray-500 ml-3">
                                    {formatTime(conv.lastTime)}
                                </div>
                            </div>
                            <div className="text-xs text-gray-600 truncate mt-1">
                                {truncate(conv.lastMessage || "")}
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        </aside>
    );
};

export default Sidebar;
