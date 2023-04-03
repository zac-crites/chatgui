import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';

function ChatHistory({ chatHistory, onMessageEdit, onMessageDelete }) {
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [lastText, setLastText] = useState("");
  const chatHistoryRef = React.useRef(null);

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
    chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
  }, [chatHistory]);

  return (
    <div className="chat-history" ref={chatHistoryRef}>
      { chatHistory ?
        chatHistory.map((message, index) => (
        <div key={index} className={`chat-message ${message.role}`}>
          <div className="message-role">{message.role.toUpperCase()}</div> 
          {editingMessageId === message.id ? (
            <div>
                <div className="message-actions">
                    <button onClick={(event) => handleEditSubmit(message.id, lastText)}>
                        Save
                    </button>
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