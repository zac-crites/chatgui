import './App.css';
import { Configuration, OpenAIApi } from 'openai';
import { useState, useEffect } from 'react';

import { Chat, Message } from './Model'
import * as Utils from './ChatUtils';
import ChatHistory from './ChatHistory';
import SettingsPanel from './SettingsPanel';
import ChatInput from './ChatInput';
import ItemChooser from './ItemChooser';
import ChatList from './ChatList';

const config = new Configuration({ apiKey: localStorage.getItem("apiKey") ?? "" });
const openai = new OpenAIApi(config);

function App() {

  const [message, setMessage] = useState('');
  const [numTokens, setNumTokens] = useState(1024);
  const [temperature, setTemperature] = useState(0.7);
  const [topP, setTopP] = useState(1);
  const [frequencyPenalty, setFrequencyPenalty] = useState(0);
  const [presencePenalty, setPresencePenalty] = useState(0);
  const [transientChatId, setTransientChatId] = useState("");

  const [modalTitle, setModalTitle] = useState<string | null>(null);
  const [modalListChats, setModalListChats] = useState<Chat[] | null>(null);

  const defaultChat = Utils.chatWithPrompt("Assistant", "You are a helpful assistant.");

  const [chats, setChats] = useState<Chat[]>(() => JSON.parse(localStorage.getItem('chats') as string) ?? [defaultChat]);
  const [templates, setTemplates] = useState<Chat[]>(() => JSON.parse(localStorage.getItem('templates') as string) ?? [defaultChat]);
  const [selectedChatId, setSelectedChatId] = useState(() => localStorage.getItem("selectedChatId") ?? defaultChat.id);
  const [history, setHistory] = useState<Chat[]>(() => JSON.parse(localStorage.getItem('history') as string) ?? []);
  const [archive, setArchive] = useState<Chat[]>(() => JSON.parse(localStorage.getItem('archive') as string) ?? []);

  const selectedChat = chats.find((chat) => chat.id === selectedChatId) || new Chat("", []);

  useEffect(() => localStorage.setItem('chats', JSON.stringify(chats)), [chats]);
  useEffect(() => localStorage.setItem('selectedChatId', selectedChatId), [selectedChatId]);
  useEffect(() => localStorage.setItem('templates', JSON.stringify(templates)), [templates]);
  useEffect(() => localStorage.setItem('history', JSON.stringify(history)), [history]);
  useEffect(() => localStorage.setItem('archive', JSON.stringify(archive)), [archive]);

  const commitUserMessage = (chats: Chat[]) => {
    return (message && message.trim().length !== 0)
      ? Utils.pushMessage(chats, selectedChat, new Message("user", message))
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
    const newChatWithSpinner = Utils.pushMessage(newChats, Utils.getChat(newChats, selectedChatId), new Message("INFO", "Waiting for assistant..."));
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
      const final = Utils.pushMessage(newChats, Utils.getChat(newChats, selectedChatId), new Message(
        choice.message.role,
        choice.message.content,
      ));
      setChats(final);
      const finalChat = Utils.getChat(final, selectedChatId)
      setHistory([new Chat(finalChat.name, finalChat.log), ...history].slice(0, 50));
      setTransientChatId("");
    }
    catch (error) {
      console.log(error);
      setChats(Utils.pushMessage(newChats, selectedChat, new Message("INFO", "ERROR")));
    }
  };

  const handleFileSelect = (event: any) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newChats = Utils.pushMessage(chats, selectedChat, new Message("user", "```\n" + (e.target ?? {}).result + "```"));
        setChats(newChats);
      };
      reader.readAsText(file);
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
  
  const handleEditRole = (messageId: string, newRole: string) => {
    setChats(
      Utils.replaceHistory(
        chats,
        selectedChatId,
        selectedChat.log.map((message: any) => message.id === messageId ? { ...message, role: newRole } : message)));
  };

  const handleSaveTemplate = () => {
    const newTemplate = new Chat(
      selectedChat.name,
      selectedChat.log,
    );
    const newTemplates = templates.filter((t) => t.name !== selectedChat.name)
    setTemplates([...newTemplates, newTemplate]);
  };

  const handleReset = () => {
    setChats(Utils.replaceHistory(chats, selectedChatId, selectedChat.log.length > 0 ? [selectedChat.log[0]] : []));
  };

  const handleShowHistory = () => {
    setModalTitle("Response History");
    setModalListChats(history);
  }

  const handleShowArchive = () => {
    setModalTitle("Archived Chats");
    setModalListChats(archive);
  }

  const handleCloseModal = () => {
    setModalTitle(null);
    setModalListChats(null);
  }
  
  const handleClickChatListItem = (chatId: string) => {
    if ( modalListChats === null) return;

    const chat = modalListChats.find(chat => chat.id === chatId);
    const newChat = new Chat(chat?.name ?? "", chat?.log ?? []);
    setChats([...chats.filter(c => c.id !== transientChatId), newChat]);
    setSelectedChatId(newChat.id);
    setTransientChatId(newChat.id);
  };

  return (
    <div className="App">
      <div>
      <ChatList 
            chats={chats}
            setChats={setChats}
            selectedChatId={selectedChatId}
            setSelectedChatId={setSelectedChatId}
            transientChatId={transientChatId}
            setTransientChatId={setTransientChatId}
            templates={templates}
            handleShowHistory={handleShowHistory}
            handleShowArchive={handleShowArchive} 
            />

        <ItemChooser
          title={modalTitle ?? "Select Chat"}
          items={modalListChats ?? []}
          onSelect={(e: Chat) => handleClickChatListItem(e.id)}
          isOpen={modalTitle !== null}
          onClose={handleCloseModal}
          getLabel={(chat: Chat) => chat.name}
          getDetail={(chat: Chat) => chat.log[chat.log.length - 1].content}
          />
      </div>

      <div className="chat-container">
        <ChatHistory
          chat={selectedChat}
          onMessageEdit={handleEditMessage}
          onMessageDelete={handleDeleteMessage}
          onSetRole={handleEditRole} />

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