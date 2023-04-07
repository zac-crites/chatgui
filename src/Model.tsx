import { v4 as uuidv4 } from 'uuid';

class Message {
    readonly id: string;
    readonly role: string;
    content: string;
    constructor(role: string, content: string) {
        this.id = uuidv4().toString();
        this.role = role;
        this.content = content;
    }
}

class Chat {
    readonly id: string;
    readonly name: string;
    readonly log: Array<Message>;
    public constructor(name: string = "", log: Array<Message> = []) {
        this.id = uuidv4().toString();
        this.name = name ?? "";
        this.log = log ?? [];
    }
}

export {
    Message,
    Chat
}