import { Chat, Message } from './Model'

export const fold = <T extends unknown, S extends unknown>(reducer: (state: S, element: T) => S, init: S, xs: T[]) => {
    let acc = init;
    for (const x of xs) {
        acc = reducer(acc, x);
    }
    return acc;
};

export const pairwise = <T extends unknown>(arr: T[]) => {
    const s = arr.slice(1)
    return s.map((value, index) => [arr[index], s])
}

export const chatWithPrompt = (title: string, prompt: string) =>
    new Chat(title, [new Message("system", prompt)]);

export const addNewChat = (chats: Array<Chat>, title: string, prompt: string) => [...chats, chatWithPrompt(title, prompt)];

export const loadMemory = (chats: Array<Chat>, chat:Chat, key: string) => {
    const mem = localStorage.getItem("memory-" + key.toLowerCase());
    return pushMessage(chats, chat, new Message("system", "`" + key + ":`\n" + mem));
};

export const doRoll = (chats: Array<Chat>, chat: Chat, roll = 20) => {
    const msg = "`Random number 1-" + roll + ": `\n" + (1 + Math.floor(Math.random() * roll))
    return pushMessage(chats, chat, new Message("system", msg));
}

export const checkForCommands = (chats: Chat[], chat: Chat, message: Message) => {
    if (message.role === "system")
        return chats;

    const cmd = message.content.split(" ");
    if (cmd.length > 1 && cmd[0] === "/load") {
        chats = cmd.slice(1).reduce(
            (chats: any, arg: any) => loadMemory(chats, chat, arg),
            chats);
    }
    else if (cmd.length > 0 && cmd[0] === "/roll") {
        chats = doRoll(chats, chat, cmd[1] ? parseInt(cmd[1]) : 20 );
    }
    else if (cmd.length > 0 && cmd[0] === "/merge") {
        chats = mergeByRole( chats, chat );
    }

    const regex = /```\s*COMMAND:\s*(\S+)\s*(\nARG:(.*?))```/gs;
    let match;
    while ((match = regex.exec(message.content))) {
        const command = match[1];
        const args: Array<any> = [];

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
            chats = loadMemory(chats, chat, args[0]);
        }
        else if (command === "ROLL" && args.length === 1) {
            chats = doRoll(chats, chat, args[0])
        }
    }
    return chats;
};
export const updateChat = (chats: Chat[], id: string, fn: any) => chats.map((c: Chat) => c.id === id ? fn(c) : c);

export const replaceChat = (chats: Chat[], chat: Chat) => updateChat(chats, chat.id, (c: any) => chat);

export const replaceHistory = (chats: Chat[], id: string, log: Message[]) => updateChat(chats, id, (c: Chat) => ({ ...c, log: log } as Chat));

export const getChat = (chats: Chat[], id: string) => chats.find((c) => c.id === id) || new Chat("", []);

export const mergeByRole = (chats: Chat[], chat: Chat) => {
    let newLog = fold((result, m) => {
        const last = result.pop();
        if (last?.role === m.role)
        {
            result.push( new Message(m.role, last.content + "\n\n" + m.content ) );
        } 
        else
        {
            result.push( ...(last ? [ last, m ] : [ m ] ));
        }
        return result;
    }, [] as Message[], chat.log)
    return replaceHistory(chats, chat.id, newLog);
};

export const pushMessage = (chats: Chat[], chat: Chat, message: Message) => {
    console.log(message);
    chats = replaceHistory(chats, chat.id, [...chat.log, message]);
    chats = checkForCommands(chats, chat, message);
    return chats;
};

export const appendTemplate = (chats: any, id: any, template: any) => {
    return replaceHistory(chats, id, [
        ...getChat(chats, id).log,
        ...(template.history ?? template.log).map((m: any) => new Message(m.role, m.content))
    ]);
};

export const newFromTemplate = (chats: any, template: any) =>
    [...chats, new Chat(template.name, (template.history ?? template.log).map((m: any) => new Message(m.role, m.content)))];