import { Configuration, OpenAIApi, CreateChatCompletionRequest } from 'openai';
import { Message } from './Model'

const config = new Configuration({ apiKey: localStorage.getItem("apiKey") ?? "" });
const openai = new OpenAIApi(config);

const defaultSettings : CreateChatCompletionRequest = {
    model: "gpt-3.5-turbo",
    temperature: 0.7,
    max_tokens: 1024,
    top_p: 1.0,
    frequency_penalty: 0,
    presence_penalty: 0,
    messages: [] 
};

class RequestHelper {

    requestSettings : CreateChatCompletionRequest;

    constructor(settings = defaultSettings) {
        this.requestSettings = settings;
    }

    async getCompletion( messages:Message[] ) {
        const settings = { 
            ...this.requestSettings, 
            messages: messages.map((m:any) => ({ role: m.role, content: m.content })) };

        const response = await openai.createChatCompletion( settings );

        console.log( response.data );
        const choice = response.data.choices[0];
        return (choice)
            ? new Message( choice?.message?.role ?? "", choice?.message?.content ?? "" )
            : new Message( "INFO", "Empty response");
    }
};

export default RequestHelper;