import './App.css';
import { Configuration, OpenAIApi } from 'openai';
import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

import * as Utils from './ChatUtils';
import ChatHistory from './ChatHistory';
import SettingsPanel from './SettingsPanel';
import ChatInput from './ChatInput';

const config = new Configuration({ apiKey: localStorage.getItem("apiKey") ?? "" });
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
    JSON.parse(localStorage.getItem('templates') as string) ?? [Utils.chatWithPrompt("Assistant", "You are a helpful assistant.")]
  );

  const [chats, setChats] = useState<Utils.Chat[]>(() =>
    JSON.parse(localStorage.getItem('chats') as string) ?? [Utils.chatWithPrompt("Assistant", "You are a helpful assistant.")]
  );

  const [selectedChatId, setSelectedChatId] = useState(() =>
    localStorage.getItem("selectedChatId") ?? uuidv4().toString()
  );

  const selectedChat = chats.find((chat) => chat.id === selectedChatId) || new Utils.Chat("", []);

  useEffect(() => {
    localStorage.setItem('chats', JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    localStorage.setItem('selectedChatId', selectedChatId);
  }, [selectedChatId]);

  useEffect(() => {
    localStorage.setItem('templates', JSON.stringify(templates));
  }, [templates]);

  const commitUserMessage = (chats: Utils.Chat[]) => {
    return (message && message.trim().length !== 0)
      ? Utils.pushMessage(chats, selectedChatId, new Utils.Message("user", message))
      : chats;
  };

  const handleCommit = (event: any) => {
    event.preventDefault();
    setChats(commitUserMessage(chats));
    setMessage("");
  };

  const handleSubmit = async (event: any) => {
    event.preventDefault();

    const newChats = commitUserMessage(chats);
    const newChatWithSpinner = Utils.pushMessage(newChats, selectedChatId, new Utils.Message("INFO", "Waiting for assistant..."));
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
        messages: (Utils.getChat(newChats, selectedChatId).log).map((msg: any) => ({ role: msg.role, content: msg.content }))
      });
      console.log(response.data)
      const choice = response.data.choices[0] as any;
      if (!choice) return;
      setChats(Utils.pushMessage(newChats, selectedChatId, new Utils.Message(
        choice.message.role,
        choice.message.content,
      )));
    }
    catch (error) {
      console.log(error);
      setChats(Utils.pushMessage(newChats, selectedChatId, new Utils.Message("INFO", "ERROR")));
    }
  };

  const handleChatSelect = (chatId: string) => {
    setSelectedChatId(chatId);
  };

  const handleNewChat = () => {
    const newChats = Utils.addNewChat(chats, "Assistant", "You are a helpful assistant.");
    setChats(newChats);
    setSelectedChatId(newChats[newChats.length - 1].id);
  };

  const handleFileSelect = (event: any) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newChats = Utils.pushMessage(chats, selectedChatId, new Utils.Message("user", "```\n" + (e.target ?? {}).result + "```"));
        setChats(newChats);
      };
      reader.readAsText(file);
    }
  };

  const handleDeleteChat = (chatId: any) => {
    const newChats = chats.filter((chat: any) => chat.id !== chatId);
    setChats(newChats);
    if (!newChats.some((chat: any) => chat.id === selectedChatId)) {
      setSelectedChatId(newChats.length > 0 ? newChats[0].id : "");
    }
  };

  const handleEditMessage = (messageId: any, newContent: any) => {
    setChats(
      Utils.replaceHistory(
        chats,
        selectedChatId,
        selectedChat.log.map((message: any) => message.id === messageId ? { ...message, content: newContent } : message)));
  };

  const handleDeleteMessage = (messageId: any) => {
    setChats(Utils.replaceHistory(chats, selectedChatId, selectedChat.log.filter((message: any) => message.id !== messageId)));
  };

  const handleChatNameEdit = (chatId: any, newName: any) => {
    setChats(Utils.updateChat(chats, chatId, (c: any) => ({ ...c, name: newName })));
    setNewChatName("");
  };

  const handleNewChatFromTemplate = (template: any) => {
    if (!template) return;
    const newChats = Utils.newFromTemplate(chats, template);
    setChats(newChats);
    setSelectedChatId(newChats[newChats.length - 1].id);
    setTemplateValue("");
  };

  const handleAppendTemplate = (template: any) => {
    if (!template) return;
    setChats(Utils.appendTemplate(chats, selectedChatId, template));
    setAppendTemplateValue("");
  };

  const handleSaveTemplate = () => {
    const newTemplate = {
      name: selectedChat.name,
      history: selectedChat.log,
    };
    const newTemplates = templates.filter((t: any) => t.name !== selectedChat.name)
    setTemplates([...newTemplates, newTemplate]);
  };

  const handleReset = () => {
    setChats(Utils.replaceHistory(chats, selectedChatId, selectedChat.log.length > 0 ? [selectedChat.log[0]] : []));
  };

  return (
    <div className="App">
      <div>
        <div className="chat-list">
          <div className="new-chat-button" onClick={handleNewChat}>
            + New Chat
          </div>
          {chats.map((chat: any) => (
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
            <select value={templateValue} onChange={(e) => handleNewChatFromTemplate(templates[e.target.value])}>
              <option value="">New Chat from Template</option>
              {templates.map((template: any, index: any) => (
                <option key={index} value={index}>{template.name}</option>
              ))}
            </select>
          </div>

          <div className="new-chat-from-template">
            <select value={appendTemplateValue} onChange={(e) => handleAppendTemplate(templates[e.target.value])}>
              <option value="">Append Template</option>
              {templates.map((template: any, index: any) => (
                <option key={index} value={index}>{template.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="chat-container">
        <ChatHistory
          chatHistory={selectedChat.log}
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
