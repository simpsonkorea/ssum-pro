'use client';

import { useState, useEffect, useRef, use } from 'react';
import Link from 'next/link';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AnalysisContext {
  ssumScore: number;
  level: string;
  summary: string;
}

export default function ChatPage({ params }: { params: Promise<{ reportId: string }> }) {
  const { reportId } = use(params);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [usage, setUsage] = useState(0);
  const [context, setContext] = useState<AnalysisContext | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Load report context from sessionStorage
    const cached = sessionStorage.getItem(`report_${reportId}`);
    if (cached) {
      const data = JSON.parse(cached);
      setContext({
        ssumScore: data.ssumScore,
        level: data.level,
        summary: data.summary,
      });

      // Welcome message
      setMessages([
        {
          role: 'assistant',
          content: `안녕하세요! 저는 AI 연애 코치예요 💕\n\n분석 결과를 보니 현재 ${data.level} 단계네요. (${data.ssumScore}점)\n\n어떤 고민이 있으신가요? 대화 전략, 메시지 작성, 밀당 타이밍 등 무엇이든 물어보세요!`,
        },
      ]);
    } else {
      setMessages([
        {
          role: 'assistant',
          content: '안녕하세요! 저는 AI 연애 코치예요 💕\n\n연애 고민이 있으시면 무엇이든 물어보세요!',
        },
      ]);
    }

    // Load chat history from localStorage
    const chatHistory = localStorage.getItem(`chat_${reportId}`);
    if (chatHistory) {
      const { messages: savedMessages, usage: savedUsage } = JSON.parse(chatHistory);
      if (savedMessages?.length > 1) {
        setMessages(savedMessages);
        setUsage(savedUsage || 0);
      }
    }
  }, [reportId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Save chat to localStorage
  useEffect(() => {
    if (messages.length > 1) {
      localStorage.setItem(`chat_${reportId}`, JSON.stringify({ messages, usage }));
    }
  }, [messages, usage, reportId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content: userMessage }],
          analysisContext: context ? JSON.stringify(context) : '',
          reportId,
          currentUsage: usage,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '응답 생성 실패');
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: data.message }]);
      setUsage(data.usage);

    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: error instanceof Error ? error.message : '죄송해요, 응답을 생성하는 데 문제가 발생했어요.',
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const quickMessages = [
    '답장이 늦게 와요',
    '먼저 연락해도 될까요?',
    '이모티콘 추천해주세요',
    '썸 끊어야 할까요?',
  ];

  const remainingChats = 100 - usage;

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-pink-100 px-4 py-3 flex items-center justify-between">
        <Link
          href={`/report/${reportId}`}
          className="flex items-center gap-2 text-gray-600"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          리포트
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xl">💬</span>
          <span className="font-semibold text-gray-800">AI 연애 코치</span>
        </div>
        <div className="text-sm">
          <span className={`px-2 py-1 rounded-full ${
            remainingChats > 50 ? 'bg-green-100 text-green-700' :
            remainingChats > 20 ? 'bg-yellow-100 text-yellow-700' :
            'bg-red-100 text-red-700'
          }`}>
            {remainingChats}회 남음
          </span>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, i) => (
          <div
            key={i}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-br-md'
                  : 'bg-white text-gray-800 shadow-md rounded-bl-md'
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-800 shadow-md rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Messages */}
      {messages.length <= 1 && (
        <div className="px-4 pb-2">
          <div className="flex flex-wrap gap-2">
            {quickMessages.map((msg) => (
              <button
                key={msg}
                onClick={() => {
                  setInput(msg);
                  inputRef.current?.focus();
                }}
                className="px-3 py-1.5 bg-white border border-pink-200 rounded-full text-sm text-gray-600 hover:bg-pink-50 hover:border-pink-300 transition-colors"
              >
                {msg}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="bg-white border-t border-pink-100 p-4">
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="메시지를 입력하세요..."
            rows={1}
            className="flex-1 resize-none border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            disabled={remainingChats <= 0}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading || remainingChats <= 0}
            className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-6 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-shadow"
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </form>
        {remainingChats <= 0 && (
          <p className="text-center text-sm text-red-500 mt-2">
            상담 횟수가 모두 소진되었습니다.
          </p>
        )}
      </div>
    </div>
  );
}
