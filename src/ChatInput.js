import React from 'react';

function ChatInput({ message, setMessage, handleCommit, handleSubmit, handleFileSelect }) {
  const messageRef = React.useRef(null);
  const inputFileRef = React.useRef(null);

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      handleCommit(event);
    }
  };
  const handleFileButtonClick = () => {
    inputFileRef.current.click();
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div className="input-container">
            <div>
                <textarea
                className="message-input"
                type="text"
                white-space="pre-wrap"
                ref={messageRef}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                onKeyDown={handleKeyDown}
                />
            </div>

            <div className="input-actions" style={{display: 'flex', flexDirection: 'row'}}>
                <button type='button' onClick={handleCommit}>Add</button>
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
    </div>
  );
}

export default ChatInput;