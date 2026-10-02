import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import { Anchor } from 'lucide-react';

export default function Chat() {
  const { id: boatId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const bottomRef = useRef();
  const inputRef = useRef();

  const [boat, setBoat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get(`/boats/${boatId}`),
      api.get(`/boats/${boatId}/chat/messages`),
    ])
      .then(([boatRes, chatRes]) => {
        setBoat(boatRes.data);
        setMessages(chatRes.data);
      })
      .catch(() => navigate('/dashboard'));
  }, [boatId, navigate]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  const send = async () => {
    const text = input.trim();
    if (!text || thinking) return;
    setInput('');
    setError('');
    setThinking(true);

    const tempId = `temp-${Date.now()}`;
    setMessages(prev => [...prev, { id: tempId, role: 'user', content: text }]);

    try {
      const res = await api.post(`/boats/${boatId}/chat/messages`, { message: text });
      setMessages(prev => [
        ...prev.filter(m => m.id !== tempId),
        { id: `u-${Date.now()}`, role: 'user', content: text },
        { id: `a-${Date.now()}`, role: 'assistant', content: res.data.reply },
      ]);
    } catch {
      setError(t('chat.error'));
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setInput(text);
    } finally {
      setThinking(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const clearChat = async () => {
    if (!window.confirm(t('chat.confirmClear'))) return;
    await api.delete(`/boats/${boatId}/chat/messages`);
    setMessages([]);
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col" style={{ height: 'calc(100vh - 8rem)' }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <Link to={`/boats/${boatId}`} className="text-sm text-magenta hover:underline">
            ← {boat?.name}
          </Link>
          <h1 className="text-3xl font-bold text-ink mt-1">{t('chat.title')}</h1>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="text-xs text-slate-400 hover:text-band-ashore px-3 py-1.5 rounded-lg hover:bg-band-ashore/10 transition-colors"
          >
            {t('chat.clear')}
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {messages.length === 0 && !thinking && (
          <div className="text-center py-16 text-slate-400 select-none">
            <Anchor size={40} strokeWidth={1.5} className="mx-auto mb-3 text-ocean-400" aria-hidden="true" />
            <p className="font-medium text-slate-600">{t('chat.empty')}</p>
            <p className="text-sm mt-1">{t('chat.emptyHint')}</p>
          </div>
        )}

        {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
        {thinking && <ThinkingBubble />}

        {error && (
          <p className="text-sm text-band-ashore bg-band-ashore/10 rounded-md px-4 py-2 text-center">{error}</p>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 pt-3 border-t border-line">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('chat.placeholder')}
            rows={1}
            disabled={thinking}
            className="flex-1 border border-slate-200 rounded-md px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-magenta resize-none disabled:opacity-60 leading-relaxed"
            style={{ maxHeight: '120px', overflowY: 'auto' }}
          />
          <button
            onClick={send}
            disabled={!input.trim() || thinking}
            className="bg-deep text-deep-on w-10 h-10 rounded-md hover:bg-deep-hover disabled:opacity-40 transition-colors shrink-0 flex items-center justify-center text-lg font-bold"
          >
            ↑
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-1.5 ml-1">{t('chat.sendHint')}</p>
      </div>
    </div>
  );
}

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-deep flex items-center justify-center text-deep-on shrink-0 mt-0.5">
          <Anchor size={16} strokeWidth={1.75} aria-hidden="true" />
        </div>
      )}
      <div
        className={`max-w-[80%] px-4 py-3 rounded-lg text-sm leading-relaxed whitespace-pre-wrap break-words ${
          isUser
            ? 'bg-deep text-deep-on rounded-br-none'
            : 'bg-surface border border-line text-ink rounded-bl-none'
        }`}
      >
        {msg.content}
      </div>
    </div>
  );
}

function ThinkingBubble() {
  return (
    <div className="flex gap-2 justify-start">
      <div className="w-8 h-8 rounded-full bg-deep flex items-center justify-center text-deep-on shrink-0 mt-0.5">
        <Anchor size={16} strokeWidth={1.75} aria-hidden="true" />
      </div>
      <div className="bg-surface border border-line px-4 py-3.5 rounded-lg rounded-bl-none">
        <div className="flex gap-1.5 items-center">
          <span className="w-2 h-2 bg-ocean-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-ocean-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-ocean-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}
