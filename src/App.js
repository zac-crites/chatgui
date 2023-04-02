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
  const [appendTemplateValue, setAppendTemplateValue] = useState("");
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
  
  const getHistory = (chats, id) => {
    var chat = chats.find( (chat) => chat.id === selectedChatId );
    return chat ? chat.history : [];
  };

  const pushMessage = (chats, message) => {
    chats = chats.map((chat) =>
      chat.id === selectedChatId ?  {...chat, history: [...chat.history, message ] } : chat
    );
    chats = checkForCommands( chats, message );
    setChats(chats);
    return chats;
  };

  const commitUserMessage = (event) => {
    event.preventDefault();
    
    if ( !message || message.trim().length === 0) 
      return;
      
    const newChats = pushMessage( chats, { id: uuidv4().toString(), role: "user", content: message } );
    setChats(newChats);
    setMessage("");
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    
    const newMessage = { id: uuidv4().toString(), role: "user", content: message };
    const newChats =
      (message && message.trim().length !== 0)
      ? pushMessage( chats, newMessage ) : chats;

    const newChatWithSpinner = pushMessage( newChats, { id: uuidv4().toString(), role: "system", content: "Waiting for assistant..." });
    setChats(newChatWithSpinner);
    setMessage("");

    openai.createChatCompletion( {
      model: "gpt-3.5-turbo",
      max_tokens: numTokens,      
      temperature: temperature,
      top_p: topP,
      frequency_penalty: frequencyPenalty,
      presence_penalty: presencePenalty,
      messages: (getHistory(newChats, selectedChatId)).map( (msg) => ({ role: msg.role, content: msg.content }) )
    })
      .then((response) => {
        console.log(response.data)
        let responseMessage = {
          id: uuidv4().toString(),
          role: response.data.choices[0].message.role,
          content: response.data.choices[0].message.content,
        };
        const finalHistory = [...newChats.find((chat) => chat.id === selectedChatId).history, responseMessage];
        const finalChats = newChats.map((chat) =>
          chat.id === selectedChatId ?  {...chat, history: finalHistory} : chat
        );
        const result = checkForCommands(finalChats,responseMessage);
        setChats(result);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const addNewChat = (chats,title,message) => {
    const newChat = {
      id: uuidv4().toString(),
      name: title || `Chat ${uuidv4().toString().substr(0,4)}`, 
      history: [ { id: uuidv4().toString(), role : "system", content: message } ],
    };
    setChats([...chats, newChat]);
    setSelectedChatId(newChat.id);
    return [...chats, newChat]
  };
  
  const loadMemory = (chats, key) => {
    const mem = localStorage.getItem( "memory-"+ key );
    return pushMessage( chats, { id: uuidv4().toString(), role : "system", content: "`" + key + ":`\n" + mem } );
  };

  const checkForCommands = (chats, message) => {
    if (message.role === "system" )
      return chats;

    const cmd = message.content.split( " " );
    if( cmd.length > 1 && cmd[0] === "/load" )
    {
      chats = cmd.slice(1).reduce( 
        (chats, arg) => loadMemory( chats, arg ),
        chats );
    }

    const regex = /```\s*COMMAND:\s*(\S+)\s*(\nARG:(.*?))```/gs;
    let match;
    while ((match = regex.exec(message.content))) {
      const command = match[1];
      const args = [];
    
      // Match all the argument strings and add them to the args array
      const argRegex = /ARG:(.*?)(?=\nARG:|$)/gs;
      let argMatch;
      while ((argMatch = argRegex.exec(match[2]))) {
        args.push(argMatch[1].trim());
      }
    
      console.log(`Found command: ${command}`);
      if (args.length > 0) {
        console.log(`  Args:`);
        args.forEach((arg, i) => console.log(`    ${i + 1}: ${arg}`));
      }

      if ( command === "NEWCHAT" && args.length === 2 ) {
        chats = addNewChat(chats, args[0], args[1]);
      }
      if ( command === "SAVE" && args.length === 2 ) {
        localStorage.setItem( "memory-"+ args[0], args[1] );
      }
      if ( command === "LOAD" && args.length === 1 ) {
        loadMemory( args[0] );
      }
    }
    return chats;
  };

  const handleChatSelect = (chatId) => {
    setSelectedChatId(chatId);
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
          content: "```\n" + content + "```",
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
  
  const handleAppendTemplate = (template) => {
    if(!template) return;

    const templateHistory = template.history.map((msg) => ({...msg, id: uuidv4().toString()}))
    const chatsWithSubmittedMessage = chats.map((chat) =>
      chat.id === selectedChatId ? {...chat, history: [...chat.history, ...templateHistory] } : chat
    );
    setChats(chatsWithSubmittedMessage);
    setTemplateValue("");
  };

  const handleSaveTemplate = () => {
    const newTemplate = {
      name: selectedChat.name,
      history: selectedChat.history,
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
      <div>

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
        
        <div className="new-chat-from-template">
          <select value={appendTemplateValue} onChange={(e) => handleAppendTemplate(templates[e.target.value],setAppendTemplateValue)}>
            <option value="">Append Template</option>
            {templates.map((template, index) => (
              <option key={index} value={index}>{template.name}</option>
            ))}
          </select>
        </div>
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
          handleCommit={commitUserMessage}
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
