import { v4 as uuidv4 } from 'uuid';

export const message = (role:any, content:any) => ({ id: uuidv4().toString(), role: role, content: content });

export const chat = (title:any, history:any) => ({
    id: uuidv4().toString(),
    name: title,
    history: history ?? [],
});

export const chatWithPrompt = (title:any, prompt:any) => ({
    id: uuidv4().toString(),
    name: title,
    history: prompt ? [message("system", prompt)] : [],
});

export const addNewChat = (chats:any, title:any, prompt:any) => [...chats, chatWithPrompt(title, prompt)];

export const loadMemory = (chats:any, id:any, key:any) => {
    const mem = localStorage.getItem("memory-" + key.toLowerCase());
    return pushMessage(chats, id, message("system", "`" + key + ":`\n" + mem));
};

export const doRoll = (chats:any, id:any, roll = 20) => {
    const msg = "`Random number 1-" + roll + ": `\n" + (1 + Math.floor(Math.random() * roll))
    return pushMessage(chats, id, message("system", msg));
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
export const updateChat = (chats:any, id:any, fn:any) => chats.map((c:any) => c.id === id ? fn(c) : c);

export const replaceChat = (chats:any, id:any, chat:any) => updateChat(chats, id, (c:any) => chat);

export const replaceHistory = (chats:any, id:any, history:any) => updateChat(chats, id, (c:any) => ({ ...c, history: history }));

export const getChat = (chats:any, id:any) => chats.find((c:any) => c.id === id);

export const pushMessage = (chats:any, id:any, message:any) => {
    chats = replaceHistory(chats, id, [...getChat(chats, id).history, message]);
    chats = checkForCommands(chats, id, message);
    return chats;
};

export const appendTemplate = (chats:any, id:any, template:any) => {
    return replaceHistory(chats, id, [
        ...getChat(chats, id).history,
        ...template.history.map((m:any) => message(m.role, m.content))
    ]);
};

export const newFromTemplate = (chats:any, template:any) =>
    [...chats, chat(template.name, template.history.map((m:any) => message(m.role, m.content)))];