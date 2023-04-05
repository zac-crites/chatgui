import React, { useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';

function ChatHistory({ chat, onMessageEdit, onMessageDelete, onSetRole }) {
  const [editingMessageId, setEditingMessageId] = useState(null);
  const chatHistoryRef = useRef(null);
  const previousChatRef = useRef();

  const roleList = ["user", "assistant", "system"];

  const chatHistory = chat.log;

  const handleEditButtonClick = (messageId) => {
    setEditingMessageId(messageId);
  };

  const handleEditCancel = () => {
    setEditingMessageId(null);
  };

  const handleEditSubmit = (messageId, newContent) => {
    setEditingMessageId(null);
    onMessageEdit(messageId, newContent);
  };

  const handleDeleteButtonClick = (messageId) => {
    onMessageDelete(messageId);
  };

  React.useEffect(() => {
    const old = previousChatRef.current ?? { id : "", log : [] };
    if( old.id !== chat.id || 
      (old?.log?.length > 0 && chat?.log?.length > 0 && old.log[old.log.length-1].id !== chat.log[chat.log.length-1].id) )
    {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
    previousChatRef.current = chat;
  }, [chat]);

  return (
    <div className="chat-history scrollbar" ref={chatHistoryRef}>
      { chatHistory ?
        chatHistory.map((message, index) => (
        <div key={index} className={`chat-message ${message.role}`}>
          <div className="message-role">
            { roleList.find( r => r === message.role ) ? (
              <select value={message.role} onChange={(e) => onSetRole(message.id, e.target.value)}>
                {roleList.map( (role, idx) => (
                  <option key={idx}>{role}</option>
                ))}
              </select>  
            ) : ( 
              <div>
                {message.role.toUpperCase()}
              </div>
            )
          }
          </div> 
          {editingMessageId === message.id ? (
            <div>
                <div className="message-actions">
                    <button onClick={handleEditCancel}>Cancel</button>
                </div>
              <textarea
                type="text"
                defaultValue={message.content}
                onBlur={(event)=>handleEditSubmit(message.id, event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    handleEditSubmit(message.id, event.target.value);
                  }
                }}
              />
            </div>
          ) : (
            <div>
                <div className="message-actions">
                    <button onClick={() => handleEditButtonClick(message.id)}>Edit</button>
                    <button onClick={() => handleDeleteButtonClick(message.id)}>Delete</button>
                </div>
                <div className="message-content"><ReactMarkdown>{message.content}</ReactMarkdown></div>
            </div>
          )}
        </div>
      ))
        :
        <div></div>
    }
    </div>
  );
}

export default ChatHistory;