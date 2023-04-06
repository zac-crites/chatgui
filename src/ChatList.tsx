
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
    templates: Chat[]
};

const ChatList = ({
    chats,
    setChats,
    selectedChatId,
    setSelectedChatId,
    transientChatId,
    setTransientChatId,
    templates } : ChatListProps ) => {

    const [editingName, setEditingName] = useState(false);
    const [newChatName, setNewChatName] = useState("");
    const [templateValue, setTemplateValue] = useState("");

    const textBoxRef = React.useRef(null);

    React.useEffect(() => {
      (textBoxRef?.current as any)?.focus();
    }, [editingName]);
  
    const handleNewFromTemplate = (template: Chat) => {
        if (!template) return;
        const newChats = Utils.newFromTemplate(chats, template);
        setChats(newChats);
        setSelectedChatId(newChats[newChats.length - 1].id);
        setTemplateValue("");
    };

    const handleChatSelect = (chatId: string) => {
        if (chatId !== transientChatId) {
            setChats(chats.filter(c => c.id !== transientChatId));
        } else {
            setTransientChatId("");
        }
        if ( chatId !== selectedChatId )
        {
            setEditingName(false);
        }
        setSelectedChatId(chatId);
    };

    const handleDeleteChat = (chatId: string) => {
        const idx = chats.findIndex(c => c.id === chatId)
        const newChats = chats.filter((chat: any) => chat.id !== chatId);
        setChats(newChats);
        setSelectedChatId(newChats.length > 0 ? newChats[Math.min(newChats.length - 1, idx)].id : "")
    };

    const commitChatName = (chatId: any, newName: any) => {
        setChats(Utils.updateChat(chats, chatId, (c: any) => ({ ...c, name: newName })));
        setEditingName(false);
    };

    const startChatNameEdit = (name:string) => {
        setEditingName(true);
        setNewChatName(name)
    };
  
    return (
        <div className="chat-list scrollbar">
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
                        onDoubleClick={() => startChatNameEdit(chat.name)} >
                        {editingName && chat.id === selectedChatId ? (
                            <input
                                ref={textBoxRef}
                                type="text"
                                value={newChatName}
                                onChange={(e) => setNewChatName(e.target.value)}
                                onBlur={() => commitChatName(chat.id, newChatName)}
                                onFocus={(e) => e.target.select()}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        commitChatName(chat.id, newChatName);
                                    } else if ( e.key === "Escape" ){
                                        setEditingName(false);
                                    }
                                }}
                            />
                        ) : (
                            chat.name
                        )}
                    </div>
                    <div className="delete-chat-button" onClick={() => handleDeleteChat(chat.id)}>
                        X
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ChatList;