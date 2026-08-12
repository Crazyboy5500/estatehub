import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { messageService } from '../../services/messageService';
import { useAuth } from '../../hooks/useAuth';
import { handleError } from '../../services/api';
import { Spinner, EmptyState } from '../../components/ui';
import { timeAgo } from '../../utils/format';
import { PaperAirplaneIcon } from '@heroicons/react/24/outline';
import type { Conversation, Message } from '../../types';
import type { RootState } from '../../redux/store';

export default function MessagesPage() {
  const { user, notify, catchError } = useAuth();
  const { t } = useTranslation();
  const socket = useSelector((s: RootState) => s.ui.socket);
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [active, setActive] = useState<string | null>(searchParams.get('conversation') || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messageService
      .getConversations()
      .then(({ data }) => {
        setConversations(data.data);
        const fromUrl = searchParams.get('conversation');
        if (fromUrl && data.data.some((c: Conversation) => c._id === fromUrl)) {
          setActive(fromUrl);
        } else if (!active && data.data.length) {
          setActive(data.data[0]._id);
        }
      })
      .catch((err) => catchError(err, t('notify.loadConversations')))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!active) return;
    setLoadingMessages(true);
    setMessages([]);
    messageService
      .getMessages(active)
      .then(({ data }) => setMessages(data.data))
      .catch((err) => catchError(err, t('notify.loadMessages')))
      .finally(() => setLoadingMessages(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  useEffect(() => {
    if (!socket) return undefined;
    const handler = (msg: Message): void => {
      if (msg.conversation === active) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
      }
      setConversations((prev) => {
        const list = prev.map((c) =>
          c._id === msg.conversation ? { ...c, lastMessage: msg.message, lastMessageAt: msg.createdAt } : c
        );
        return list.sort((a, b) => new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime());
      });
    };
    socket.on('message:new', handler);
    return () => {
      socket.off('message:new', handler);
    };
  }, [socket, active]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    if (!text.trim() || !active) return;
    const value = text;
    setText('');
    try {
      const { data } = await messageService.send(active, value);
      setMessages((prev) => [...prev, data.data]);
      setConversations((prev) =>
        prev
          .map((c) => (c._id === active ? { ...c, lastMessage: value, lastMessageAt: new Date().toISOString() } : c))
          .sort((a, b) => new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime())
      );
    } catch (error) {
      catchError(error, t('notify.sendMessage'));
      setText(value);
    }
  };

  const otherParticipant = (c: Conversation | undefined): { name?: string; role?: string } | undefined => {
    const other =
      c?.otherUser || c?.participants?.find((p) => typeof p !== 'string' && p._id !== user?._id);
    if (other && typeof other === 'object') return other as { name?: string; role?: string };
    return undefined;
  };

  const roleLabel = (role?: string): string => {
    if (!role) return '';
    if (role === 'owner') return t('messages.roleOwner');
    if (role === 'buyer') return t('messages.roleBuyer');
    return t('messages.roleAdmin');
  };

  if (loading) return <Spinner />;

  return (
    <div className="card flex h-[70vh] overflow-hidden">
      <div className="w-72 shrink-0 overflow-y-auto border-r border-gray-200 dark:border-gray-800 max-sm:hidden">
        {conversations.length === 0 ? (
          <div className="p-4 text-sm text-gray-500">{t('messages.noConversations')}</div>
        ) : (
          conversations.map((c) => {
            const other = otherParticipant(c);
            return (
              <button
                key={c._id}
                onClick={() => setActive(c._id)}
                className={`w-full border-b border-gray-100 p-4 text-left transition hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800 ${active === c._id ? 'bg-primary-50 dark:bg-primary-950' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-600 text-sm font-bold text-white">
                    {(other?.name?.[0] as string) || (c.otherUser?.name?.[0] as string) || '?'}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {other?.name || c.otherUser?.name}
                      <span className="ml-1.5 text-[10px] font-medium text-gray-400">{roleLabel(other?.role || c.otherUser?.role)}</span>
                    </p>
                    <p className="truncate text-xs text-gray-500">{c.property?.title || t('messages.generalChat')}</p>
                    {c.lastMessage && <p className="mt-0.5 truncate text-xs text-gray-400">{c.lastMessage}</p>}
                  </div>
                </div>
                <p className="mt-1 text-right text-[10px] text-gray-400">{timeAgo(c.lastMessageAt || '')}</p>
              </button>
            );
          })
        )}
      </div>

      <div className="flex flex-1 flex-col">
        {!active ? (
          <div className="flex flex-1 items-center justify-center">
            <EmptyState icon="💬" title={t('messages.selectConversation')} message={t('messages.selectConversationMsg')} />
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 border-b border-gray-200 p-4 dark:border-gray-800">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-600 text-sm font-bold text-white">
                {otherParticipant(conversations.find((c) => c._id === active))?.name?.[0] || '?'}
              </div>
              <div>
                <p className="font-semibold">
                  {otherParticipant(conversations.find((c) => c._id === active))?.name}
                  <span className="ml-2 text-[11px] font-medium text-gray-400">{roleLabel(otherParticipant(conversations.find((c) => c._id === active))?.role)}</span>
                </p>
                <p className="text-xs text-gray-500">{t('messages.onlineVia')}</p>
              </div>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto bg-gray-50 p-4 dark:bg-gray-950">
              {loadingMessages ? (
                <Spinner />
              ) : (
                messages.map((m) => {
                  if (m.isSystem) {
                    return (
                      <div key={m._id} className="flex justify-center">
                        <div className="max-w-[85%] rounded-xl bg-gray-200/70 px-4 py-2 text-center text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                          <p className="mb-0.5 font-semibold text-gray-500 dark:text-gray-400">⚙ {t('messages.system')}</p>
                          <p>{m.message}</p>
                          <p className="mt-1 text-[10px] text-gray-400">{timeAgo(m.createdAt || '')}</p>
                        </div>
                      </div>
                    );
                  }
                  const isMine =
                    typeof m.sender === 'object'
                      ? String(m.sender?._id) === String(user?._id)
                      : String(m.sender) === String(user?._id);
                  const senderName: string = typeof m.sender === 'object' && m.sender ? m.sender.name : 'User';
                  return (
                    <div key={m._id} className={`flex items-end gap-2 ${isMine ? 'justify-end' : 'justify-start'}`}>
                      {!isMine && (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-600 text-xs font-bold text-white">
                          {senderName[0]?.toUpperCase() || '?'}
                        </div>
                      )}
                      <div className={`flex max-w-[75%] flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                        {!isMine && (
                          <p className="mb-0.5 px-1 text-[10px] font-semibold text-gray-400">{senderName}</p>
                        )}
                        <div
                          className={`px-4 py-2.5 text-sm shadow-sm ${
                            isMine
                              ? 'rounded-2xl rounded-br-md bg-primary-600 text-white'
                              : 'rounded-2xl rounded-bl-md bg-white text-gray-800 ring-1 ring-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:ring-gray-700'
                          }`}
                        >
                          <p>{m.message}</p>
                          <p className={`mt-1 text-[10px] ${isMine ? 'text-primary-100' : 'text-gray-400'}`}>
                            {timeAgo(m.createdAt || '')}
                            {isMine && <span className="ml-1">✓✓</span>}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            <form onSubmit={(e) => void send(e)} className="flex items-center gap-2 border-t border-gray-200 p-3 dark:border-gray-800">
              <input
                className="input flex-1"
                placeholder={t('messages.typeMessage')}
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
              <button type="submit" className="btn-primary px-5" disabled={!text.trim()}>
                <PaperAirplaneIcon className="h-5 w-5" />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}