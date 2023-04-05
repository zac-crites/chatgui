
import { Chat, Message } from './Model'
import * as Utils from './ChatUtils'
import React, { useState } from 'react';

type ChatListProps = {
    chats: Chat[],
    setChats: (_: Chat[]) => void,
    selectedChatId: string,
    setSelectedChatId: (_: string) => void,
    transientChatId: string,
    setTransientChatId: (_: string) => void,
    templates: Chat[],
    handleShowHistory:()=>void,
    handleShowArchive:()=>void 
};

const ChatList = ({
    chats,
    setChats,
    selectedChatId,
    setSelectedChatId,
    transientChatId,
    setTransientChatId,
    templates,
    handleShowHistory,
    handleShowArchive } : ChatListProps ) => {

    const [newChatName, setNewChatName] = useState("");
    const [templateValue, setTemplateValue] = useState("");
    const [appendTemplateValue, setAppendTemplateValue] = useState("");

    const handleNewFromTemplate = (template: Chat) => {
        if (!template) return;
        const newChats = Utils.newFromTemplate(chats, template);
        setChats(newChats);
        setSelectedChatId(newChats[newChats.length - 1].id);
        setTemplateValue("");
    };

    const handleAppendTemplate = (template: Chat) => {
        if (!template) return;
        setChats(Utils.appendTemplate(chats, selectedChatId, template));
        setAppendTemplateValue("");
    };

    const handleChatSelect = (chatId: string) => {
        if (chatId !== transientChatId) {
            setChats(chats.filter(c => c.id !== transientChatId));
        } else {
            setTransientChatId("");
        }
        setSelectedChatId(chatId);
    };

    const handleDeleteChat = (chatId: string) => {
        const idx = chats.findIndex(c => c.id === chatId)
        const newChats = chats.filter((chat: any) => chat.id !== chatId);
        setChats(newChats);
        setSelectedChatId(newChats.length > 0 ? newChats[Math.min(newChats.length - 1, idx)].id : "")
    };

    const handleChatNameEdit = (chatId: any, newName: any) => {
        setChats(Utils.updateChat(chats, chatId, (c: any) => ({ ...c, name: newName })));
        setNewChatName("");
    };

    // const handleArchiveChat = (chatId: string) => {
    //     const idx = chats.findIndex(c => c.id === chatId)
    //     const chat = chats[idx];
    //     const newChats = chats.filter((c: any) => c.id !== chatId);
    //     setChats(newChats);
    //     setArchive(chat ? [chat, ...archive] : archive);
    //     setSelectedChatId(newChats.length > 0 ? newChats[Math.min(newChats.length - 1, idx)].id : defaultChat.id)
    // };

    return (
        <div className="chat-list">
            <div className="new-chat-from-template">
                <select value={templateValue} onChange={(e) => handleNewFromTemplate(templates[parseInt(e.target.value)])}>
                    <option value="">New Chat</option>
                    {templates.map((template: Chat, index: number) => (
                        <option key={index} value={index}>{template.name}</option>
                    ))}
                </select>
            </div>

            {chats.map((chat: any) => (
                <div key={chat.id} className={`chat-item ${chat.id === selectedChatId ? 'active' : ''} ${chat.id === transientChatId ? 'transient' : ''}`}>
                    <div
                        className={`chat-name ${chat.id === selectedChatId ? 'active' : ''}`}
                        onClick={() => handleChatSelect(chat.id)}
                        onDoubleClick={() => setNewChatName(chat.name)}
                    >
                        {newChatName !== "" && chat.id === selectedChatId ? (
                            <input
                                type="text"
                                value={newChatName}
                                onChange={(e) => setNewChatName(e.target.value)}
                                onBlur={() => handleChatNameEdit(chat.id, newChatName)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        handleChatNameEdit(chat.id, newChatName);
                                    }
                                }}
                            />
                        ) : (
                            "" + chat.name
                        )}
                    </div>
                    <div className="delete-chat-button" onClick={() => handleDeleteChat(chat.id)}>
                        X
                    </div>
                </div>
            ))}

            <div className="new-chat-from-template">
                <button onClick={handleShowHistory}>⏱️</button>
                <button onClick={handleShowArchive}>⏱️⏱️</button>
            </div>

            <div className="new-chat-from-template">
                <select value={appendTemplateValue} onChange={(e) => handleAppendTemplate(templates[parseInt(e.target.value)])}>
                    <option value="">Append Template</option>
                    {templates.map((template: Chat, index: number) => (
                        <option key={index} value={index}>{template.name}</option>
                    ))}
                </select>
            </div>

            <div className="new-chat-from-template">
                <button onClick={(e) => { /*handleArchiveChat(selectedChatId)*/ }}>⏱️⏱️</button>
            </div>
        </div>
    );
};

export default ChatList;