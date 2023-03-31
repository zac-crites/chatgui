import React from 'react';

function ChatHistory({ chatHistory }) {
  const chatHistoryRef = React.useRef(null);

  React.useEffect(() => {
    chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
  }, [chatHistory]);

  return (
    <div className="chat-history" ref={chatHistoryRef}>
      {chatHistory.map((message, index) => (
        <div key={index} className={`chat-message ${message.role}`}>
          {message.content}
        </div>
      ))}
    </div>
  );
}

export default ChatHistory;