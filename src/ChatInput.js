import React from 'react';

function ChatInput({ message, setMessage, handleSubmit }) {
  const messageRef = React.useRef(null);

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      handleSubmit(event);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="input-container">
        <input
          className="message-input"
          type="text"
          ref={messageRef}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button type="submit">Send</button>
      </div>
    </form>
  );
}

export default ChatInput;