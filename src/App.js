import './App.css';
import {Configuration, OpenAIApi} from 'openai';
import React, { useState, useRef, useEffect } from 'react';

const config = new Configuration( {  
  apiKey: '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',
});

const openai = new OpenAIApi(config);

function App() {

  const [message, setMessage] = useState('How many ounces in a pound?');
  const [numTokens, setNumTokens] = useState(256);
  const [temperature, setTemperature] = useState(0.7);
  const [topP, setTopP] = useState(1);
  const [frequencyPenalty, setFrequencyPenalty] = useState(0);
  const [presencePenalty, setPresencePenalty] = useState(0);
  const [chatHistory, setChatHistory] = useState([]);

  const messageRef = useRef(null);
  const numTokensRef = useRef(null);
  const temperatureRef = useRef(null);
  const topPRef = useRef(null);
  const frequencyPenaltyRef = useRef(null);
  const presencePenaltyRef = useRef(null);
  const chatHistoryRef = useRef(null);

  const handleSubmit = (event) => {
    event.preventDefault();
    const messageValue = messageRef.current.value;
    const numTokensValue = parseInt(numTokensRef.current.value);
    const temperatureValue = parseFloat(temperatureRef.current.value);
    const topPValue = parseFloat(topPRef.current.value);
    const frequencyPenaltyValue = parseFloat(frequencyPenaltyRef.current.value);
    const presencePenaltyValue = parseFloat(presencePenaltyRef.current.value);

    setMessage("");
    
    const currentChat = [...chatHistory,{
      role: "user",
      content: messageValue,
    }];
    setChatHistory(currentChat);
    
    openai.createChatCompletion( {
      model: "gpt-3.5-turbo",
      max_tokens: numTokensValue,      
      temperature: temperatureValue,
      top_p: topPValue,
      frequency_penalty: frequencyPenaltyValue,
      presence_penalty: presencePenaltyValue,
      messages: [
        { role : "system", content: "You are a helpful assistant." },
        ...currentChat
      ]
    })
      .then((response) => {
        console.log(response.data)
        const newMessage = {
          role: response.data.choices[0].message.role,
          content: response.data.choices[0].message.content,
        };
        setChatHistory([...currentChat,newMessage]);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  useEffect(() => {
    chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
  }, [chatHistory]);

  return (
    <div className="App">
      <div className="chat-container">
        <div className="chat-history" ref={chatHistoryRef}>
          {chatHistory.map((message, index) => (
            <div key={index} className={`chat-message ${message.role}`}>
              {message.content}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="input-container">
            <input
              className="message-input"
              type="text"
              ref={messageRef}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
            />
            <button type="submit">Send</button>
          </div>
        </form>
      </div>

      <div className="settings-panel">
        <h2>Settings</h2>
        <label>
          Max Tokens:
          <input
            type="number"
            ref={numTokensRef}
            value={numTokens}
            onChange={(event) => setNumTokens(event.target.value)}
          />
        </label>
        <label>
          Temperature:
          <input
            type="number"
            step="0.1"
            min="0"
            max="1"
            ref={temperatureRef}
            value={temperature}
            onChange={(event) => setTemperature(event.target.value)}
          />
        </label>
        <label>
          Top P:
          <input
            type="number"
            step="0.1"
            min="0"
            max="1"
            ref={topPRef}
            value={topP}
            onChange={(event) => setTopP(event.target.value)}
          />
        </label>
        <label>
          Frequency Penalty:
          <input
            type="number"
            step="0.1"
            min="0"
            max="1"
            ref={frequencyPenaltyRef}
            value={frequencyPenalty}
            onChange={(event) => setFrequencyPenalty(event.target.value)}
          />
        </label>
        <label>
          Presence Penalty:
          <input
            type="number"
            step="0.1"
            min="0"
            max="1"
            ref={presencePenaltyRef}
            value={presencePenalty}
            onChange={(event) => setPresencePenalty(event.target.value)}
          />
        </label>
      </div>
    </div>
  );
}

export default App;
