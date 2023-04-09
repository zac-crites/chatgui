import { Chat, Message } from '../Model';
import {
  addNewChat,
  appendTemplate,
  checkForCommands,
  doRoll,
  fold,
  getChat,
  loadMemory,
  mergeByRole,
  newFromTemplate,
  pairwise,
  pushMessage,
  replaceHistory,
  updateChat,
} from '../ChatUtils';

const setupChats : () => [Chat[],Chat] = () => {
  const chat = new Chat("chat2", []);
  return [ [new Chat("chat1", []), chat], chat ];
}

describe('fold', () => {
  it('should reduce an array of numbers to the sum', () => {
    const reducer = (acc: number, x: number) => acc + x;
    const xs = [1, 2, 3, 4];
    expect(fold(reducer, 0, xs)).toEqual(10);
  });

  it('should reduce an array of strings to a concatenated string', () => {
    const reducer = (acc: string, x: string) => acc + x;
    const xs = ['foo', 'bar', 'baz'];
    expect(fold(reducer, '', xs)).toEqual('foobarbaz');
  });
});

describe('pairwise', () => {
  it('should return an empty array given an empty array', () => {
    expect(pairwise([])).toEqual([]);
  });

  it('should return an array of pairs given an array with multiple elements', () => {
    const arr = ['foo', 'bar', 'baz'];
    expect(pairwise(arr)).toEqual([
      ['foo', 'bar'],
      ['bar', 'baz'],
    ]);
  });
});

describe('addNewChat', () => {
  it('should add a new chat to the array of chats', () => {
    const chats = [new Chat('chat1', [])];
    const title = 'chat2';
    const prompt = 'Enter a message';
    const newChats = addNewChat(chats, title, prompt);
    expect(newChats.length).toEqual(2);
    expect(newChats[1].name).toEqual(title);
    expect(newChats[1].log.length).toEqual(1);
    expect(newChats[1].log[0].role).toEqual('system');
    expect(newChats[1].log[0].content).toEqual(prompt);
  });
});

describe('loadMemory', () => {
  it('should load memory from localStorage', () => {
    const [chats,chat] = setupChats();
    const key = 'myKey';
    localStorage.setItem('memory-mykey', 'myMemory');
    expect(loadMemory(chats, chat, key)).toMatchObject([
      {name:'chat1', log:[]},
      {name:'chat2', log:[{role:'system', content:'`myKey:`\nmyMemory'}]},
    ]);
  });
});

describe('doRoll', () => {
  it('should roll a random number between 1 and 20', () => {
    const [chats,chat] = setupChats();
    const result = doRoll(chats, chat);
    expect(result.length).toEqual(2);
    expect(result[1].log[0].role).toEqual('system');
    expect(result[1].log[0].content).toMatch(/^`Random number 1-20: `\n\d+$/);
  });

  it('should roll a random number between 1 and the specified value', () => {
    const [chats,chat] = setupChats();
    const result = doRoll(chats, chat, 10);
    expect(result.length).toEqual(2);
    expect(result[1].log[0].role).toEqual('system');
    expect(result[1].log[0].content).toMatch(/^`Random number 1-10: `\n\d+$/);
  });
});

describe('checkForCommands', () => {
  it('should return the same array of chats if the message is from the system', () => {
    const [chats,chat] = setupChats();
    const message = new Message('system', 'Some system message');
    expect(checkForCommands(chats, chat, message)).toEqual(chats);
  });

  it('should handle /load command', () => {
    const [chats,chat] = setupChats();
    const message = new Message('user', '/load myKey');
    localStorage.setItem('memory-mykey', 'myMemory');
    expect(checkForCommands(chats, chat, message)).toMatchObject([
      {name:'chat1', log:[]},
      {name:'chat2', log:[{role:'system', content:'`myKey:`\nmyMemory'}]},
    ]);
  });

  it('should handle /roll command', () => {
    const [chats,chat] = setupChats();
    const message = new Message('user', '/roll 10');
    const result = checkForCommands(chats, chat, message);
    expect(result.length).toEqual(2);
    expect(result[1].log[0].role).toEqual('system');
    expect(result[1].log[0].content).toMatch(/^`Random number 1-10: `\n\d+$/);
  });

  it('should handle /merge command', () => {
    const chats = [
      new Chat('chat1', [new Message('user', 'hi'), new Message('system', 'hello')]),
      new Chat('chat2', [new Message('system', 'baz'),new Message('user', 'foo'), new Message('user', 'bar')]),
    ];
    const chat = chats[1];
    const message = new Message('user', '/merge');
    const result = checkForCommands(chats, chat, message);
    expect(result.length).toEqual(2);
    expect(result[1].log).toMatchObject([
      {role:'system', content:'baz'},
      {role:'user', content:'foo\n\nbar'},
    ]);
  });

  it('should handle command with template', () => {
    const chats = [new Chat('chat1', []), new Chat('chat2', [])];
    const chat = new Chat('chat2', []);
    const message = new Message('user', '```COMMAND: NEWCHAT\nARG: newchat1\nARG: Enter message```');
    const result = checkForCommands(chats, chat, message);
    expect(result.length).toEqual(3);
    expect(result[2]).toMatchObject({
      name: 'newchat1',
      log: [{role:'system', content:'Enter message'}]
    });
  });
});

describe('mergeByRole', () => {
  it('should merge consecutive messages with the same role', () => {
    const chats = [
      new Chat('chat1', []),
      new Chat('chat2', [
        new Message('user', 'hello'),
        new Message('user', 'world'),
        new Message('system', 'foo'),
        new Message('system', 'bar'),
        new Message('user', 'baz'),
      ]),
    ];
    const chat = chats[1];
    expect(mergeByRole(chats, chat)).toMatchObject([
      {name: 'chat1', log: []},
      {
        name: 'chat2',
        log: [
          {role: 'user', content: 'hello\n\nworld'},
          {role: 'system', content: 'foo\n\nbar'},
          {role: 'user', content: 'baz'},
        ],
      },
    ]);
  });
});

describe('pushMessage', () => {
  it('should add a message to the chat log and check for commands', () => {
    const chats = [new Chat('chat1', []), new Chat('chat2', [])];
    const chat = chats[1];
    const message = new Message('user', 'hello');
    expect(pushMessage(chats, chat, message)).toMatchObject([
      { name: 'chat1', log: [] },
      { name: 'chat2', log: [{ role: 'user', content: 'hello' }] },
    ]);
  });
});

describe('appendTemplate', () => {
  it('should append a template to the chat log', () => {
    const chats = [new Chat('chat1', []), new Chat('chat2', [new Message('user', 'hello')])];
    const chatId = chats[1].id;
    const template = new Chat('template', [new Message('system', 'world')]);
    expect(appendTemplate(chats, chatId, template)).toMatchObject([
      { name: 'chat1', log: [] },
      { name: 'chat2', log: [{ role: 'user', content: 'hello' }, { role: 'system', content: 'world' }] },
    ]);
  });
});

describe('newFromTemplate', () => {
  it('should create a new chat from a template', () => {
    const chats = [new Chat('chat1', []), new Chat('chat2', [new Message('user', 'hello')])];
    const template = new Chat('template', [new Message('system', 'world')]);
    expect(newFromTemplate(chats, template)).toMatchObject([
      { name: 'chat1', log: [] },
      { name: 'chat2', log: [{ role: 'user', content: 'hello' }] },
      { name: 'template', log: [{ role: 'system', content: 'world' }] },
    ]);
  });
});

describe('replaceHistory', () => {
  it('should replace the chat history with the given log', () => {
    const chats = [new Chat('chat1', []), new Chat('chat2', [new Message('user', 'hello')])];
    const chatId = chats[1].id;
    const log = [new Message('user', 'world')];
    expect(replaceHistory(chats, chatId, log)).toMatchObject([
      { name: 'chat1', log: [] },
      { name: 'chat2', log: [{ role: 'user', content: 'world' }] },
    ]);
  });
});

describe('getChat', () => {
  it('should return the chat with the given ID if it exists', () => {
    const [chats,chat] = setupChats();
    expect(getChat(chats, chat.id)).toEqual(chat);
  });

  it('should return a new chat if the ID is not found', () => {
    const chats = [new Chat('chat1', []), new Chat('chat2', [])];
    expect(getChat(chats, 'chat3')).toMatchObject({name: '', log: []});
  });
});

describe('updateChat', () => {
  it('should apply the given function to the chat with the given ID', () => {
    const chats = [new Chat('chat1', []), new Chat('chat2', [])];
    const fn = (chat: Chat) => new Chat(chat.name, [new Message('user', 'hello')]);
    expect(updateChat(chats, chats[1].id, fn)).toMatchObject([
        {name:"chat1", log:[]}, 
        {name:'chat2', log:[{role:'user',content:'hello'}]}]);
  });
});
