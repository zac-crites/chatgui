import './App.css';
import {Configuration, OpenAIApi} from 'openai';
import React, { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

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
  
  const [chats, setChats] = useState(() => {
    return JSON.parse(localStorage.getItem('chats')) ?? [{
      id: 1,
      name: 'General',
      history: [ { role : "system", content: "You are a helpful assistant." } ],
    },];
  });

  const [selectedChatId, setSelectedChatId] = useState( () => {
    const data = localStorage.getItem("selectedChatId");
    return data ? data : uuidv4().toString(); } );

  const selectedChat = chats.find((chat) => chat.id === selectedChatId) || { history: [] };

  useEffect(() => {
    localStorage.setItem('chats', JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    localStorage.setItem('selectedChatId', selectedChatId);
  }, [selectedChatId]);
  

  const handleSubmit = (event) => {
    event.preventDefault();
    
    const newHistory = [...selectedChat.history,{
      role: "user",
      content: message,
    }];
    const newChats = chats.map((chat) =>
      chat.id === selectedChatId ? {...chat, history:newHistory} : chat
    );
    setChats(newChats);
    setMessage("");
    
    openai.createChatCompletion( {
      model: "gpt-3.5-turbo",
      max_tokens: numTokens,      
      temperature: temperature,
      top_p: topP,
      frequency_penalty: frequencyPenalty,
      presence_penalty: presencePenalty,
      messages: newHistory
    })
      .then((response) => {
        console.log(response.data)
        const finalHistory = [...newHistory, {
          role: response.data.choices[0].message.role,
          content: response.data.choices[0].message.content,
        }];
        const finalChats = newChats.map((chat) =>
          chat.id === selectedChatId ?  {...chat, history: finalHistory} : chat
        );
        setChats(finalChats);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const handleChatSelect = (chatId) => {
    setSelectedChatId(chatId);
    console.log( selectedChat );
  };

  const handleNewChat = () => {
    const id = uuidv4().toString();
    const newChat = {
      id: id,
      name: `Chat ${id.substr(0,4)}`, 
      history: [ { role : "system", content: "You are a helpful assistant." } ],
    };
    setChats([...chats, newChat]);
    setSelectedChatId(id);
  };

  const handleNewChat1 = async () => {
    const id = uuidv4().toString();
    const newChat = {
      id: id,
      name: `Chat ${id.substr(0, 4)}`,
      history: [],
    };
    try {
      const file = await fetch('/manifest.json'); // Change the file path to your desired file
      const text = await file.text();
      if (text) {
        newChat.history.push({ role: 'system', content: text });
      }
    } catch (error) {
      console.log(error);
    }
    setChats([...chats, newChat]);
    setSelectedChatId(id);
  };

  const handleDeleteChat = (chatId) => {
    const newChats = chats.filter((chat) => chat.id !== chatId);
    setChats(newChats);
    if( !chats.some((chat) => chat.id === selectedChatId) ) {
      setSelectedChatId( chats.length > 0 ? chats[0].id : "" );
    }
  };

  return (
    <div className="App">
      <div className="chat-list">
      <div className="new-chat-button" onClick={handleNewChat}>
        + New Chat
      </div>
        {chats.map((chat) => (
        <div key={chat.id} className={`chat-item ${chat.id === selectedChatId ? 'active' : ''}`}>
        <div
          className={`chat-name ${chat.id === selectedChatId ? 'active' : ''}`}
          onClick={() => handleChatSelect(chat.id)}
        >
          {chat.name}
        </div>
        <div className="delete-chat-button" onClick={() => handleDeleteChat(chat.id)}>
          X
        </div>
      </div>
        ))}
        
      </div>

      <div className="chat-container">

        <ChatHistory chatHistory={selectedChat.history} />

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
