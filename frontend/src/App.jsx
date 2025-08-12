import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/Chatwindow";
import { io } from "socket.io-client";
import './app.css';

const socket = io(import.meta.env.VITE_API_BASE?.replace("/api", "") || "http://localhost:8000");

const App = () => {
  const [selectedChat, setSelectedChat] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  document.title = "WhatsApp Clone";
  const link = document.querySelector("link[rel~='icon']") || document.createElement("link");
  link.rel = "icon";
  link.href = 'https://upload.wikimedia.org/wikipedia/commons/a/a7/2062095_application_chat_communication_logo_whatsapp_icon.svg';
  document.getElementsByTagName("head")[0].appendChild(link);

  useEffect(() => {

    socket.on("connect", () => {
      console.log("✅ Socket connected:", socket.id);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleSelectConversation = (wa_id, name, phone) => {
    setSelectedChat({ wa_id, name, phone });
    socket.emit("join_room", wa_id);

    if (window.innerWidth < 768) {
      setSidebarCollapsed(true);
    }
  };

  const handleBack = () => {
    setSelectedChat(null);
    setSidebarCollapsed(false);
  };

  return (
    <div className="flex h-screen w-screen bg-gray-200">
      {!sidebarCollapsed && (
        <Sidebar
          onSelectConversation={handleSelectConversation}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
          socket={socket}
        />
      )}

      {selectedChat && (
        <ChatWindow chat={selectedChat} onBack={handleBack} socket={socket} />
      )}

      {!selectedChat && !sidebarCollapsed && (
        <div className="flex-1 hidden md:flex items-center justify-center text-gray-500">
          Select a conversation
        </div>
      )}
    </div>
  );
};

export default App;
