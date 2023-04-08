import { Configuration, OpenAIApi, CreateChatCompletionRequest } from 'openai';
import { Message } from './Model'
import { IncomingMessage } from 'http'

const config = new Configuration({ apiKey: localStorage.getItem("apiKey") ?? "" });
const openai = new OpenAIApi(config);

const defaultSettings: CreateChatCompletionRequest = {
    model: "gpt-3.5-turbo",
    temperature: 0.7,
    max_tokens: 1024,
    top_p: 1.0,
    frequency_penalty: 0,
    presence_penalty: 0,
    messages: []
};

const vaildRoles = new Set(["user", "assistant", "system"]);

class RequestHelper {

    requestSettings: CreateChatCompletionRequest;

    constructor(settings = defaultSettings) {
        this.requestSettings = settings;
    }

    async getCompletionStream(messages: Message[], onResponseUpdated: (_: string) => void) {

        const fetchOptions = {
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + localStorage.getItem("apiKey"),
            },
            method: "POST",
            body: JSON.stringify({
                ...this.requestSettings,
                stream: true,
                messages: messages.filter(m => vaildRoles.has(m.role)).map((m: any) => ({ role: m.role, content: m.content }))
            }),
        }

        const response = await fetch("https://api.openai.com/v1/chat/completions", fetchOptions);
        const reader = response.body?.pipeThrough(new TextDecoderStream()).getReader();

        while (true) {
            const chunk = await reader?.read();
            if (chunk?.done) {
                break;
            }
            const json = chunk?.value?.slice(6).split("data: ") ?? [];
            const data = json?.filter((d) => d !== "[DONE]\n\n")?.map((d) => JSON.parse(d.trim()).choices[0].delta.content);
            data?.filter((d) => d !== undefined).forEach((d) => onResponseUpdated(d));
        }
    }

    async getCompletion(messages: Message[]) {
        const settings = {
            ...this.requestSettings,
            messages: messages.filter(m => vaildRoles.has(m.role)).map((m: any) => ({ role: m.role, content: m.content }))
        };

        console.log(settings);

        const response = await openai.createChatCompletion(settings);

        console.log(response.data);
        const choice = response.data.choices[0];
        return (choice)
            ? new Message(choice?.message?.role ?? "", choice?.message?.content ?? "")
            : new Message("info", "Empty response");
    }
};

export default RequestHelper;