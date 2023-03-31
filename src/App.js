import './App.css';
import {Configuration, OpenAIApi} from 'openai';
import React, { useState, useRef, useEffect } from 'react';

import ChatHistory from './ChatHistory';
import SettingsPanel from './SettingsPanel';
import ChatInput from './ChatInput';

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

  const handleSubmit = (event) => {
    event.preventDefault();
    
    const currentChat = [...chatHistory,{
      role: "user",
      content: message,
    }];
    setChatHistory(currentChat);
    setMessage("");
    
    openai.createChatCompletion( {
      model: "gpt-3.5-turbo",
      max_tokens: numTokens,      
      temperature: temperature,
      top_p: topP,
      frequency_penalty: frequencyPenalty,
      presence_penalty: presencePenalty,
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

  return (
    <div className="App">
      <div className="chat-container">

        <ChatHistory chatHistory={chatHistory} />

        <ChatInput
          message={message}
          setMessage={setMessage}
          handleSubmit={handleSubmit}
          />
      </div>

      <SettingsPanel
        numTokens={numTokens}
        setNumTokens={setNumTokens}
        temperature={temperature}
        setTemperature={setTemperature}
        topP={topP}
        setTopP={setTopP}
        frequencyPenalty={frequencyPenalty}
        setFrequencyPenalty={setFrequencyPenalty}
        presencePenalty={presencePenalty}
        setPresencePenalty={setPresencePenalty}
        />
    </div>
  );
}

export default App;
