import { v4 as uuidv4 } from 'uuid';

export const message = (role, content) => ({ id: uuidv4().toString(), role: role, content: content });

export const chat = (title, history) => ({
    id: uuidv4().toString(),
    name: title,
    history: history ?? [],
});

export const chatWithPrompt = (title, prompt) => ({
    id: uuidv4().toString(),
    name: title,
    history: prompt ? [message("system", prompt)] : [],
});

export const addNewChat = (chats, title, prompt) => [...chats, chatWithPrompt(title, prompt)];

export const loadMemory = (chats, id, key) => {
    const mem = localStorage.getItem("memory-" + key.toLowerCase());
    return pushMessage(chats, id, message("system", "`" + key + ":`\n" + mem));
};

export const doRoll = (chats, id, roll = 20) => {
    const msg = "`Random number 1-" + roll + ": `\n" + (1 + Math.floor(Math.random() * roll))
    return pushMessage(chats, id, message("system", msg));
}

export const checkForCommands = (chats, id, message) => {
    if (message.role === "system")
        return chats;

    const cmd = message.content.split(" ");
    if (cmd.length > 1 && cmd[0] === "/load") {
        chats = cmd.slice(1).reduce(
            (chats, arg) => loadMemory(chats, id, arg),
            chats);
    }
    else if (cmd.length > 0 && cmd[0] === "/roll") {
        chats = doRoll(chats, id, cmd[1]);
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
export const updateChat = (chats, id, fn) => chats.map((c) => c.id === id ? fn(c) : c);

export const replaceChat = (chats, id, chat) => updateChat(chats, id, c => chat);

export const replaceHistory = (chats, id, history) => updateChat(chats, id, (c) => ({ ...c, history: history }));

export const getChat = (chats, id) => chats.find((c) => c.id === id);

export const pushMessage = (chats, id, message) => {
    chats = replaceHistory(chats, id, [...getChat(chats, id).history, message]);
    chats = checkForCommands(chats, id, message);
    return chats;
};

export const appendTemplate = (chats, id, template) => {
    return replaceHistory(chats, id, [
        ...getChat(chats, id).history,
        ...template.history.map((m) => message(m.role, m.content))
    ]);
};

export const newFromTemplate = (chats, template) =>
    [...chats, chat(template.name, template.history.map((m) => message(m.role, m.content)))];