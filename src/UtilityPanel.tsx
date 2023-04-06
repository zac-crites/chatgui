import { useState } from 'react'
import { Chat } from './Model'

type UtilityPanelProps = {
    templates: Chat[],
    onAppendTemplate: (_: Chat) => void,
    onShowHistory: () => void,
    onShowArchive: () => void,
    onSaveTemplate: () => void,
    onCloneChat: () => void,
    onClearChat: () => void,
    onArchiveChat: () => void,
};

const UtilityPanel = ({
    templates,
    onAppendTemplate,
    onShowHistory,
    onShowArchive,
    onSaveTemplate,
    onCloneChat,
    onClearChat,
    onArchiveChat,
}: UtilityPanelProps) => {

    const [appendTemplateValue, setAppendTemplateValue] = useState("");
    const [open, setOpen] = useState(false);

    const handleAppendTemplate = (template: Chat) => {
        onAppendTemplate(template);
        setAppendTemplateValue("");
    };

    return (
        <div className="utility-panel">
            {open ? (
                <div className='open' onMouseLeave={() => setOpen(false)}>
                    <button onClick={onShowHistory}>View History</button>
                    <button onClick={onShowArchive}>View Archive</button>
                    <button onClick={onSaveTemplate}>Save Template</button>
                    <button onClick={onCloneChat}>Clone Chat</button>
                    <button onClick={onArchiveChat}>Archive Chat</button>
                    <button onClick={onClearChat}>Clear</button>
                    <div className="new-chat-from-template">
                        <select value={appendTemplateValue} onChange={(e) => handleAppendTemplate(templates[parseInt(e.target.value)])}>
                            <option value="">Append Template</option>
                            {templates.map((template: Chat, index: number) => (
                                <option key={index} value={index}>{template.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            ) : (
                <div>
                    <button className='toggle-button' onClick={() => setOpen(!open)}>⚙️</button>
                </div>
            )}
        </div>
    );
};

export default UtilityPanel;