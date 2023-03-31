import React from 'react';

function ChatInput({ message, setMessage, handleSubmit, handleFileSelect }) {
  const messageRef = React.useRef(null);
  const inputFileRef = React.useRef(null);

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      handleSubmit(event);
    }
  };
  const handleFileButtonClick = () => {
    inputFileRef.current.click();
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="input-container">
        <textarea
          className="message-input"
          type="text"
          white-space="pre-wrap"
          ref={messageRef}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          onKeyDown={handleKeyDown}
        />
        <div style={{display: 'flex', flexDirection: 'row'}}>
        <button type="submit">Send</button>
        <div className="file-button" onClick={handleFileButtonClick}>
            💾
        </div>
        </div>
        <input
            type="file"
            className="hidden-input"
            ref={inputFileRef}
            onChange={handleFileSelect}
            />
      </div>
    </form>
  );
}

export default ChatInput;