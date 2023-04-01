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

  const [message, setMessage] = useState('');
  const [numTokens, setNumTokens] = useState(1024);
  const [temperature, setTemperature] = useState(0.7);
  const [topP, setTopP] = useState(1);
  const [frequencyPenalty, setFrequencyPenalty] = useState(0);
  const [presencePenalty, setPresencePenalty] = useState(0);
  const [newChatName, setNewChatName] = useState("");
  const [templateValue, setTemplateValue] = useState("");
  const [templates, setTemplates] = useState( () => { 
    return JSON.parse(localStorage.getItem('templates')) ?? [
    {
      name: "Assistant",
      history: [
        { id: uuidv4().toString(), role : "system", content: "You are a helpful assistant." },
      ]
    },
  ] } );
  
  const [chats, setChats] = useState(() => {
    return JSON.parse(localStorage.getItem('chats')) ?? [{
      id: 1,
      name: 'Assistant',
      history: [ { id: uuidv4().toString(), role : "system", content: "You are a helpful assistant." } ],
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
  
  useEffect(() => {
    localStorage.setItem('templates', JSON.stringify(templates));
  }, [templates]);

  const handleSubmit = (event) => {
    event.preventDefault();
    
    const newMessage = { id: uuidv4().toString(), role: "user", content: message };
    const newHistory = 
      (message && message.trim().length !== 0) 
        ? [...selectedChat.history, newMessage]
        : selectedChat.history;

    const chatsWithSubmittedMessage = chats.map((chat) =>
      chat.id === selectedChatId ? {...chat, history:newHistory} : chat
    );
    let newChats = checkForNewChat( chatsWithSubmittedMessage, newMessage );
    setChats(newChats);
    setMessage("");

    openai.createChatCompletion( {
      model: "gpt-3.5-turbo",
      max_tokens: numTokens,      
      temperature: temperature,
      top_p: topP,
      frequency_penalty: frequencyPenalty,
      presence_penalty: presencePenalty,
      messages: newHistory.map( (msg) => ({ role: msg.role, content: msg.content }) )
    })
      .then((response) => {
        console.log(response.data)
        let responseMessage = {
          id: uuidv4().toString(),
          role: response.data.choices[0].message.role,
          content: response.data.choices[0].message.content,
        };
        const finalHistory = [...newHistory, responseMessage];
        const finalChats = newChats.map((chat) =>
          chat.id === selectedChatId ?  {...chat, history: finalHistory} : chat
        );
        setChats(checkForNewChat(finalChats,responseMessage));
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const checkForNewChat = (chats, message) => {
    const newChatRegex = /```[\s\n]NEWCHAT: (.*)- (.*)```/s;
    const match = message.content.match(newChatRegex);
    if ( message.role !== "system" && match ) {
      message.processed = true;
      const title = match[1].trim();
      const prompt = match[2].trim();
      const newChat = {
        id: uuidv4().toString(),
        name: title || `Chat ${uuidv4().toString().substr(0,4)}`, 
        history: [ { id: uuidv4().toString(), role : "system", content: prompt } ],
      };
      setChats([...chats, newChat]);
      setSelectedChatId(newChat.id);
      return [...chats, newChat];
    }
    return chats;
  };

  const handleChatSelect = (chatId) => {
    setSelectedChatId(chatId);
    console.log( selectedChat );
  };

  const handleNewChat = () => {
    const id = uuidv4().toString();
    const newChat = {
      id: id,
      name: `Assist ${id.substr(0,4)}`, 
      history: [ { id: uuidv4().toString(), role : "system", content: "You are a helpful assistant." } ],
    };
    setChats([...chats, newChat]);
    setSelectedChatId(id);
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        const newMessage = {
          id : uuidv4().toString(),
          role: "user",
          content: content,
        };
        const newHistory = (content && content.trim().length !== 0) ? [...selectedChat.history, newMessage] : selectedChat.history;
        const newChats = chats.map((chat) =>
          chat.id === selectedChatId ? { ...chat, history: newHistory } : chat
        );
        setChats(newChats);
      };
      reader.readAsText(file);
    }
  };

  const handleDeleteChat = (chatId) => {
    const newChats = chats.filter((chat) => chat.id !== chatId);
    setChats(newChats);
    if( !newChats.some((chat) => chat.id === selectedChatId) ) {
      setSelectedChatId( newChats.length > 0 ? newChats[0].id : "" );
    }
  };
  
  const handleEditMessage = (messageId, newContent) => {
    const newHistory = selectedChat.history.map((message) =>
      message.id === messageId ? { ...message, content: newContent } : message
    );
    const newChats = chats.map((chat) =>
      chat.id === selectedChatId ? { ...chat, history: newHistory } : chat
    );
    setChats(newChats);
  };

  const handleDeleteMessage = (messageId) => {
    const newHistory = selectedChat.history.filter(
      (message) => message.id !== messageId
    );
    const newChats = chats.map((chat) =>
      chat.id === selectedChatId ? { ...chat, history: newHistory } : chat
    );
    setChats(newChats);
  };

  const handleChatNameEdit = (chatId, newName) => {
    const newChats = chats.map((chat) =>
      chat.id === chatId ? { ...chat, name: newName } : chat
    );
    setChats(newChats);
    setNewChatName("");
  };

  const handleNewChatFromTemplate = (template) => {
    if(!template) return;
    const id = uuidv4().toString();
    const newChat = {
      id: id,
      name: template.name, 
      history: template.history.map((msg) => ({...msg, id: uuidv4().toString()})),
    };
    setChats([...chats, newChat]);
    setSelectedChatId(id);
    setTemplateValue("");
  };

  const handleSaveTemplate = () => {
    const newTemplate = {
      name: selectedChat.name,
      history: [ selectedChat.history[0] ],
    };
    const newTemplates = templates.filter( (t) => t.name !== selectedChat.name )
    setTemplates([...newTemplates, newTemplate]);
  };

  const handleReset = () => {
    const newChats = chats.map((chat) =>
      chat.id === selectedChatId ? {...chat, history:[ chat.history[0]]} : chat
    );
    setChats(newChats);
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
          onDoubleClick={() => setNewChatName(chat.name)}
        >
            {newChatName !== "" && chat.id === selectedChatId ? (
            <input
              type="text"
              value={newChatName}
              onChange={(e) => setNewChatName(e.target.value)}
              onBlur={() => handleChatNameEdit(chat.id, newChatName)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleChatNameEdit(chat.id, newChatName);
                }
              }}
            />
          ) : (
            chat.name
          )}
        </div>
        <div className="delete-chat-button" onClick={() => handleDeleteChat(chat.id)}>
          ✖️
        </div>
      </div>
        ))}
        
        <div className="new-chat-from-template">
          <select value={templateValue} onChange={(e) => handleNewChatFromTemplate(templates[e.target.value],setTemplateValue)}>
            <option value="">New Chat from Template</option>
            {templates.map((template, index) => (
              <option key={index} value={index}>{template.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="chat-container">

        <ChatHistory
          chatHistory={selectedChat.history}
          onMessageEdit={handleEditMessage}
          onMessageDelete={handleDeleteMessage}/>

        <ChatInput
          message={message}
          setMessage={setMessage}
          handleSubmit={handleSubmit}
          handleFileSelect={handleFileSelect}
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
        handleSaveTemplate={handleSaveTemplate}
        handleReset={handleReset}
        />

    </div>
  );
}

export default App;
