import { v4 as uuidv4 } from 'uuid';

export class Message {
    readonly id : string;
    readonly role : string;
    readonly content : string;
    constructor(role:string, content:string)
    {
        this.id = uuidv4().toString();
        this.role = role;
        this.content = content;
    }
}

export class Chat {
    readonly id : string;
    readonly name : string;
    readonly log : Array<Message>;
    public constructor(name:string, log:Array<Message> = [])
    {
        this.id = uuidv4().toString();
        this.name = name;
        this.log = log ?? [];
    }
}

export const chatWithPrompt = (title:string, prompt:string) => 
    new Chat( title, [new Message("system", prompt)] );

export const addNewChat = (chats:Array<Chat>, title:string, prompt:string) => [...chats, chatWithPrompt(title, prompt)];

export const loadMemory = (chats:Array<Chat>, id:string, key:string) => {
    const mem = localStorage.getItem("memory-" + key.toLowerCase());
    return pushMessage(chats, id, new Message("system", "`" + key + ":`\n" + mem));
};

export const doRoll = (chats:Array<Chat>, id:string, roll = 20) => {
    const msg = "`Random number 1-" + roll + ": `\n" + (1 + Math.floor(Math.random() * roll))
    return pushMessage(chats, id, new Message("system", msg));
}

export const checkForCommands = (chats:any, id:any, message:any) => {
    if (message.role === "system")
        return chats;

    const cmd = message.content.split(" ");
    if (cmd.length > 1 && cmd[0] === "/load") {
        chats = cmd.slice(1).reduce(
            (chats:any, arg:any) => loadMemory(chats, id, arg),
            chats);
    }
    else if (cmd.length > 0 && cmd[0] === "/roll") {
        chats = doRoll(chats, id, cmd[1]);
    }

    const regex = /```\s*COMMAND:\s*(\S+)\s*(\nARG:(.*?))```/gs;
    let match;
    while ((match = regex.exec(message.content))) {
        const command = match[1];
        const args : Array<any> = [];

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

        if (command === "NEWCHAT" && args.length === 2) {
            chats = addNewChat(chats, args[0], args[1]);
        }
        else if (command === "SAVE" && args.length === 2) {
            localStorage.setItem("memory-" + args[0].toLowerCase(), args[1]);
        }
        else if (command === "LOAD" && args.length === 1) {
            chats = loadMemory(chats, id, args[0]);
        }
        else if (command === "ROLL" && args.length === 1) {
            chats = doRoll(chats, id, args[0])
        }
    }
    return chats;
};
export const updateChat = (chats:Chat[], id:string, fn:any) => chats.map((c:Chat) => c.id === id ? fn(c) : c);

export const replaceChat = (chats:Chat[], id:string, chat:Chat) => updateChat(chats, id, (c:any) => chat);

export const replaceHistory = (chats:Chat[], id:string, log:Message[]) => updateChat(chats, id, (c:Chat) => ({ ...c, log: log } as Chat));

export const getChat = (chats:Chat[], id:string) => chats.find((c) => c.id === id) || new Chat( "", [] );

export const pushMessage = (chats:Chat[], id:string, message:Message) => {
    console.log(message);
    chats = replaceHistory(chats, id, [...getChat(chats, id).log, message]);
    chats = checkForCommands(chats, id, message);
    return chats;
};

export const appendTemplate = (chats:any, id:any, template:any) => {
    return replaceHistory(chats, id, [
        ...getChat(chats, id).log,
        ...(template.history ?? template.log).map((m:any) => new Message(m.role, m.content))
    ]);
};

export const newFromTemplate = (chats:any, template:any) =>
    [...chats, new Chat(template.name, (template.history ?? template.log).map((m:any) => new Message(m.role, m.content)))];