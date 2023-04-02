import './App.css';
import { Configuration, OpenAIApi } from 'openai';
import React, { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import * as Utils from './ChatUtils';

import ChatHistory from './ChatHistory';
import SettingsPanel from './SettingsPanel';
import ChatInput from './ChatInput';

const config = new Configuration({ apiKey: localStorage.getItem("apiKey") });
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

  const [templates, setTemplates] = useState(() =>
    JSON.parse(localStorage.getItem('templates')) ?? [Utils.chatWithPrompt("Assistant", "You are a helpful assistant.")]
  );

  const [chats, setChats] = useState(() =>
    JSON.parse(localStorage.getItem('chats')) ?? [Utils.chatWithPrompt("Assistant", "You are a helpful assistant.")]
  );

  const [selectedChatId, setSelectedChatId] = useState(() =>
    localStorage.getItem("selectedChatId") ?? uuidv4().toString()
  );

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

  const commitUserMessage = (chats) => {
    return (message && message.trim().length !== 0)
      ? Utils.pushMessage(chats, selectedChatId, Utils.message("user", message))
      : chats;
  };

  const handleCommit = (event) => {
    event.preventDefault();
    setChats(commitUserMessage(chats));
    setMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const newChats = commitUserMessage(chats);
    const newChatWithSpinner = Utils.pushMessage(newChats, selectedChatId, Utils.message("INFO", "Waiting for assistant..."));
    setChats(newChatWithSpinner);
    setMessage("");

    try {
      const response = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        max_tokens: numTokens,
        temperature: temperature,
        top_p: topP,
        frequency_penalty: frequencyPenalty,
        presence_penalty: presencePenalty,
        messages: (Utils.getChat(newChats, selectedChatId).history).map((msg) => ({ role: msg.role, content: msg.content }))
      });
      console.log(response.data)
      setChats(Utils.pushMessage(newChats, selectedChatId, Utils.message(
        response.data.choices[0].message.role,
        response.data.choices[0].message.content,
      )));
    }
    catch (error) {
      console.log(error);
      setChats(Utils.pushMessage(newChats, selectedChatId, { id: uuidv4().toString(), role: "INFO", content: "ERROR" }));
    }
  };

  const handleChatSelect = (chatId) => {
    setSelectedChatId(chatId);
  };

  const handleNewChat = () => {
    const newChats = Utils.addNewChat(chats, "Assistant", "You are a helpful assistant.");
    setChats(newChats);
    setSelectedChatId(newChats[newChats.length - 1].id);
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newChats = Utils.pushMessage(chats, selectedChatId, Utils.message("user", "```\n" + e.target.result + "```"));
        setChats(newChats);
      };
      reader.readAsText(file);
    }
  };

  const handleDeleteChat = (chatId) => {
    const newChats = chats.filter((chat) => chat.id !== chatId);
    setChats(newChats);
    if (!newChats.some((chat) => chat.id === selectedChatId)) {
      setSelectedChatId(newChats.length > 0 ? newChats[0].id : "");
    }
  };

  const handleEditMessage = (messageId, newContent) => {
    setChats(
      Utils.replaceHistory(
        chats,
        selectedChatId,
        selectedChat.history.map((message) => message.id === messageId ? { ...message, content: newContent } : message)));
  };

  const handleDeleteMessage = (messageId) => {
    setChats(Utils.replaceHistory(chats, selectedChatId, selectedChat.history.filter((message) => message.id !== messageId)));
  };

  const handleChatNameEdit = (chatId, newName) => {
    setChats(Utils.updateChat(chats, chatId, (c) => ({ ...c, name: newName })));
    setNewChatName("");
  };

  const handleNewChatFromTemplate = (template) => {
    if (!template) return;
    const newChats = Utils.newFromTemplate(chats, template);
    setChats(newChats);
    setSelectedChatId(newChats[newChats.length - 1].id);
    setTemplateValue("");
  };

  const handleAppendTemplate = (template) => {
    if (!template) return;
    setChats(Utils.appendTemplate(chats, selectedChatId, template));
    setTemplateValue("");
  };

  const handleSaveTemplate = () => {
    const newTemplate = {
      name: selectedChat.name,
      history: selectedChat.history,
    };
    const newTemplates = templates.filter((t) => t.name !== selectedChat.name)
    setTemplates([...newTemplates, newTemplate]);
  };

  const handleReset = () => {
    setChats(Utils.replaceHistory(chats, selectedChatId, []));
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
            <select value={templateValue} onChange={(e) => handleNewChatFromTemplate(templates[e.target.value], setTemplateValue)}>
              <option value="">New Chat from Template</option>
              {templates.map((template, index) => (
                <option key={index} value={index}>{template.name}</option>
              ))}
            </select>
          </div>

          <div className="new-chat-from-template">
            <select value={appendTemplateValue} onChange={(e) => handleAppendTemplate(templates[e.target.value], setAppendTemplateValue)}>
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
          onMessageDelete={handleDeleteMessage} />

        <ChatInput
          message={message}
          setMessage={setMessage}
          handleCommit={handleCommit}
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
