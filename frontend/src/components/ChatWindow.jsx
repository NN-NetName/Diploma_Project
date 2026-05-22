import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Loader2 } from 'lucide-react';
import api from '../api'; 

const ChatWindow = ({ isLoggedIn, userId, onRequireAuth }) => {
    
    const welcomeMessage = { 
        sender: 'bot', 
        text: 'Здравствуйте! Я интеллектуальный ассистент СибАДИ.\nЯ готов ответить на ваши вопросы по регламенту поддержки молодых научно-педагогических работников. Чем я могу вам помочь сегодня?' 
    };

    const [messages, setMessages] = useState([welcomeMessage]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isLoggedIn && userId) {
            api.get(`/chat/${userId}/history`)
                .then(res => {
                    if (res.data && res.data.length > 0) {
                        const formattedHistory = res.data.map(m => ({
                            sender: m.sender,
                            text: m.content
                        }));
                        setMessages(formattedHistory);
                    } else {
                        setMessages([welcomeMessage]);
                    }
                })
                .catch(err => console.error("Ошибка загрузки истории:", err));
        } else {
            setMessages([welcomeMessage]);
        }
    }, [isLoggedIn, userId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const sendMessage = async (e) => {
        if (e) e.preventDefault();
        if (!isLoggedIn) { onRequireAuth(); return; }
        if (!input.trim()) return;

        const userText = input;
        setMessages((prev) => [...prev, { sender: 'user', text: userText }]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await api.post(`/chat/${userId}/message`, { content: userText }); 
            setMessages((prev) => [...prev, { sender: 'bot', text: response.data.content }]);
        } catch (error) {
            setMessages((prev) => [...prev, { sender: 'bot', text: '⚠️ Извините, произошла ошибка связи с сервером.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <div className="flex flex-col h-[calc(100dvh-80px)] min-h-[400px] w-full relative bg-slate-50 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-4 md:px-8 pt-8 pb-32 scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <div className="max-w-3xl mx-auto space-y-8 md:space-y-10">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex gap-3 md:gap-4 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.sender === 'bot' && (
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#315b8c] to-[#1d395a] flex items-center justify-center shrink-0 mt-1 shadow-sm">
                                    <Sparkles className="w-4 h-4 text-white" />
                                </div>
                            )}
                            <div className={`max-w-[90%] md:max-w-[85%] text-[14px] md:text-[15px] leading-relaxed ${
                                msg.sender === 'user' 
                                    ? 'bg-slate-200/80 text-slate-800 px-5 py-3 rounded-3xl rounded-tr-sm' 
                                    : 'text-slate-800 pt-1 whitespace-pre-wrap'
                            }`}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex gap-4 justify-start animate-in fade-in">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#315b8c] to-[#1d395a] flex items-center justify-center shrink-0 mt-1 shadow-sm"><Sparkles className="w-4 h-4 text-white animate-pulse" /></div>
                            <div className="text-slate-500 pt-2 flex items-center gap-2 text-sm font-medium"><Loader2 className="w-4 h-4 animate-spin text-[#315b8c]" /> Печатает ответ...</div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-slate-50 via-slate-50 to-transparent pb-1 md:pb-2 pt-12 px-2 md:px-4">
                <div className="max-w-3xl mx-auto relative">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Спросите ИИ-консультанта..."
                        className="w-full bg-white border border-slate-300 shadow-md rounded-[24px] md:rounded-[32px] pl-5 pr-14 py-3 md:py-4 resize-none focus:outline-none focus:ring-2 focus:ring-[#315b8c]/20 text-[14px] md:text-[15px] max-h-28 overflow-y-auto min-h-[50px] md:min-h-[60px] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                        rows="1"
                    />
                    <button
                        onClick={sendMessage}
                        disabled={!input.trim() || isLoading}
                        className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 p-2 bg-[#315b8c] hover:bg-[#264871] disabled:bg-slate-200 disabled:text-slate-400 rounded-full text-white transition-colors shadow-sm"
                    >
                        <Send className="w-4 h-4 md:w-5 md:h-5 ml-0.5" />
                    </button>
                </div>
                <div className="text-center mt-2 mb-1 md:mb-2 text-[10px] md:text-[11px] text-slate-400 font-medium px-2">
                    ИИ может допускать ошибки. Сверяйтесь с документами вуза.
                </div>
            </div>
        </div>
    );
};

export default ChatWindow;