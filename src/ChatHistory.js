import React, { useState } from 'react';

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
      {chatHistory.map((message, index) => (
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
                onKeyDown={(event) => {
                  setLastText( event.target.value + event.key );
                  if (event.key === 'Enter') {
                    handleEditSubmit(message.id, event.target.value);
                  } else if (event.key === 'Escape') {
                    handleEditCancel();
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
                <div className="message-content">{message.content}</div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default ChatHistory;