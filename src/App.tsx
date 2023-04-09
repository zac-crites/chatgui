import './App.css';
import { useState, useEffect } from 'react';

import { Chat, Message } from './Model'
import * as Utils from './ChatUtils';
import ChatHistory from './ChatHistory';
import SettingsPanel from './SettingsPanel';
import ChatInput from './ChatInput';
import ItemChooser from './ItemChooser';
import ChatList from './ChatList';
import RequestHelper from './RequestHelper';
import UtilityPanel from './UtilityPanel';

function App() {

  const [message, setMessage] = useState('');
  const [transientChatId, setTransientChatId] = useState("");
  const [requestSettings, setRequestSettings] = useState(new RequestHelper().requestSettings);
  const [modalTitle, setModalTitle] = useState<string | null>(null);
  const [modalListChats, setModalListChats] = useState<Chat[] | null>(null);

  const defaultChat = Utils.chatWithPrompt("Assistant", "You are a helpful assistant.");

  const [chats, setChats] = useState<Chat[]>(() => JSON.parse(localStorage.getItem('chats') as string) ?? [defaultChat]);
  const [templates, setTemplates] = useState<Chat[]>(() => JSON.parse(localStorage.getItem('templates') as string) ?? [defaultChat]);
  const [selectedChatId, setSelectedChatId] = useState(() => localStorage.getItem("selectedChatId") ?? defaultChat.id);
  const [history, setHistory] = useState<Chat[]>(() => JSON.parse(localStorage.getItem('history') as string) ?? []);
  const [archive, setArchive] = useState<Chat[]>(() => JSON.parse(localStorage.getItem('archive') as string) ?? []);

  const selectedChat = chats.find((chat) => chat.id === selectedChatId) || defaultChat;

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

    let responseMessage = new Message("assistant", "" );
    setChats(Utils.pushMessage( newChats, Utils.getChat(newChats, selectedChatId), responseMessage ));
    setMessage("");

    try {
      const requestMessages = Utils.getChat(newChats, selectedChatId).log;
      await new RequestHelper(requestSettings).getCompletionStream(requestMessages, (delta) => {
        responseMessage = new Message("assistant", responseMessage.content + delta );
        const responseChats = Utils.pushMessage( newChats, Utils.getChat(newChats, selectedChatId), responseMessage, true );
        setChats(responseChats);
      });
      const responseChats = Utils.pushMessage( newChats, Utils.getChat(newChats, selectedChatId), responseMessage);
      const finalChat = Utils.getChat(responseChats, selectedChatId);
      setHistory([new Chat(finalChat.name, finalChat.log), ...history].slice(0, 100));
      setTransientChatId("");
    }
    catch (error: any) {
      console.log(error);
      setChats(Utils.pushMessage(newChats, Utils.getChat(newChats, selectedChatId), new Message("INFO", "ERROR:\n" + error.message)));
    }
  };

  const handleFileSelect = (event: any) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newChats = Utils.pushMessage(chats, selectedChat, new Message("user", "```\n" + (e.target ?? {}).result + "\n```"));
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

  const handleAppendTemplate = (template: Chat) => setChats(Utils.appendTemplate(chats, selectedChatId, template));

  const handleCloneChat = () =>
    setChats([...chats, new Chat(selectedChat.name, selectedChat.log)]);

  const handleReset = () => {
    setChats(Utils.replaceHistory(chats, selectedChatId, selectedChat.log.length > 0 ? [selectedChat.log[0]] : []));
  };

  const handleArchiveChat = () => {
      const idx = chats.findIndex(c => c.id === selectedChatId)
      const newChats = chats.filter((c: any) => c.id !== selectedChatId);
      setChats(newChats);
      setArchive(selectedChat ? [selectedChat, ...archive] : archive);
      setSelectedChatId(newChats.length > 0 ? newChats[Math.min(newChats.length - 1, idx)].id : defaultChat.id)
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
    if (modalListChats === null) return;

    const chat = modalListChats.find(chat => chat.id === chatId);
    const newChat = new Chat(chat?.name ?? "", chat?.log ?? []);
    setChats([...chats.filter(c => c.id !== transientChatId), newChat]);
    setSelectedChatId(newChat.id);
    setTransientChatId(newChat.id);
  };

  return (
    <div className="App">
      <div style={{display:"flex", flexDirection:"column"}}>
        <ChatList
          chats={chats}
          setChats={setChats}
          selectedChatId={selectedChatId}
          setSelectedChatId={setSelectedChatId}
          transientChatId={transientChatId}
          setTransientChatId={setTransientChatId}
          templates={templates}
        />

        <UtilityPanel
          templates={templates}
          onAppendTemplate={handleAppendTemplate}
          onShowHistory={handleShowHistory}
          onShowArchive={handleShowArchive}
          onSaveTemplate={handleSaveTemplate}
          onCloneChat={handleCloneChat}
          onClearChat={handleReset} 
          onArchiveChat={handleArchiveChat}
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
        requestSettings={requestSettings}
        setRequestSettings={setRequestSettings}
      />

    </div>
  );
}

export default App;