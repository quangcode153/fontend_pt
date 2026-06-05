import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import api from '../api';

const formatTime = (isoString) => {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  } catch (e) {
    return '';
  }
};

function ChatBox({ currentUser, targetUser, isOpen, onClose, onOpenChat, unreadSenderIds, setUnreadSenderIds }) {
  const { t } = useTranslation();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [activeToast, setActiveToast] = useState(null);
  
  const stompClientRef = useRef(null);
  const messagesEndRef = useRef(null);
  const isOpenRef = useRef(isOpen);
  const targetUserRef = useRef(targetUser);

  // Sync props to refs to prevent WebSocket reconnection on modal toggle
  useEffect(() => {
    isOpenRef.current = isOpen;
    targetUserRef.current = targetUser;
  }, [isOpen, targetUser]);

  // Keep targetUser messages in sync when active chat target changes
  useEffect(() => {
    setMessages([]);
  }, [targetUser?.id]);

  // Clear unread sender dot when opening chat with that user
  useEffect(() => {
    if (isOpen && targetUser && setUnreadSenderIds) {
      setUnreadSenderIds(prev => prev.filter(id => String(id) !== String(targetUser.id)));
    }
  }, [isOpen, targetUser, setUnreadSenderIds]);

  // Background WebSocket Connection
  useEffect(() => {
    if (!currentUser?.id) return;

    const wsUrl = api.defaults.baseURL ? api.defaults.baseURL.replace('/api', '/ws') : 'http://localhost:8080/ws';

    const client = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      reconnectDelay: 5000,
      debug: (str) => console.log('STOMP background: ' + str),
      onConnect: () => {
        setIsConnected(true);
        client.subscribe(`/topic/chat/${currentUser.id}`, async (msg) => {
          const newMsg = JSON.parse(msg.body);
          
          // Ignore echo messages sent by currentUser
          if (newMsg.nguoiGuiId === currentUser.id) return;

          // Check if chat is open with this specific sender
          const isChatOpenWithSender = isOpenRef.current && targetUserRef.current && String(targetUserRef.current.id) === String(newMsg.nguoiGuiId);

          if (isChatOpenWithSender) {
            setMessages(prev => {
              if (prev.some(m => m.id === newMsg.id)) return prev;

              // Optimistic message deduplication
              const optIndex = prev.findIndex(m => m.isOptimistic && m.noiDung === newMsg.noiDung);
              if (optIndex !== -1) {
                const updated = [...prev];
                updated[optIndex] = newMsg;
                return updated;
              }
              return [...prev, newMsg];
            });
          } else {
            // Chat is closed or open with someone else. Mark as unread sender!
            if (setUnreadSenderIds) {
              setUnreadSenderIds(prev => {
                if (prev.some(id => String(id) === String(newMsg.nguoiGuiId))) return prev;
                return [...prev, newMsg.nguoiGuiId];
              });
            }

            // Show floating toast notification!
            let senderName = 'Khách/Chủ nhà';
            try {
              // Try as tenant
              const res = await api.get(`/khach-hang/chi-tiet/${newMsg.nguoiGuiId}`);
              if (res.data?.hoTen) {
                senderName = res.data.hoTen;
              } else if (res.data?.username) {
                senderName = res.data.username;
              }
            } catch {
              try {
                // Try as landlord
                const res = await api.get(`/tai-khoan/chu-tro/${newMsg.nguoiGuiId}/chi-tiet`);
                if (res.data?.hoTen) {
                  senderName = res.data.hoTen;
                } else if (res.data?.username) {
                  senderName = res.data.username;
                }
              } catch {
                if (newMsg.nguoiGuiId === 3) {
                  senderName = 'Admin (Hệ thống)';
                }
              }
            }

            setActiveToast({
              senderId: newMsg.nguoiGuiId,
              senderName,
              messageText: newMsg.noiDung,
            });
          }
        });
      },
      onStompError: (frame) => {
        console.error(t('chat.error_broker') + frame.headers['message']);
      }
    });

    client.activate();
    stompClientRef.current = client;

    return () => {
      client.deactivate();
      setIsConnected(false);
    };
  }, [currentUser?.id, setUnreadSenderIds]);

  // Load chat logs on-demand when chat window opens
  useEffect(() => {
    if (!isOpen || !currentUser?.id || !targetUser?.id) return;

    // Clear unread sender ID immediately when opening this chat
    if (setUnreadSenderIds) {
      setUnreadSenderIds(prev => prev.filter(id => String(id) !== String(targetUser.id)));
    }

    setMessages([]);
    api.get(`/tin-nhan/${currentUser.id}/${targetUser.id}`)
      .then(res => setMessages(res.data))
      .catch(err => console.error(t('chat.error_load'), err));
  }, [isOpen, currentUser?.id, targetUser?.id, setUnreadSenderIds]);

  // Auto-dismiss toast notification after 6 seconds
  useEffect(() => {
    if (!activeToast) return;
    const timer = setTimeout(() => {
      setActiveToast(null);
    }, 6000);
    return () => clearTimeout(timer);
  }, [activeToast]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!isConnected) {
      alert(t('chat.connecting_wait'));
      return;
    }

    if (input.trim()) {
      const msg = {
        nguoiGuiId: currentUser.id,
        nguoiNhanId: targetUser.id,
        noiDung: input,
        thoiGian: new Date().toISOString()
      };

      setMessages(prev => [...prev, { ...msg, isOptimistic: true }]);
      stompClientRef.current.publish({
        destination: '/app/chat.send',
        body: JSON.stringify(msg)
      });
      setInput('');
    }
  };

  const handleToastClick = () => {
    if (onOpenChat) {
      onOpenChat({ id: activeToast.senderId, username: activeToast.senderName });
    }
    if (setUnreadSenderIds) {
      setUnreadSenderIds(prev => prev.filter(id => id !== activeToast.senderId));
    }
    setActiveToast(null);
  };

  return (
    <>
      {/* Floating Glassmorphic Toast Notification */}
      {activeToast && (
        <div
          onClick={handleToastClick}
          style={{
            position: 'fixed',
            top: '80px',
            right: '20px',
            width: '320px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderLeft: '4px solid var(--accent)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            cursor: 'pointer',
            zIndex: 9999,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            animation: 'toastIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) both',
          }}
        >
          <style>{`
            @keyframes toastIn {
              from { transform: translateX(120%); opacity: 0; }
              to { transform: translateX(0); opacity: 1; }
            }
          `}</style>
          
          <div style={{
            fontSize: '16px',
            background: 'var(--accent-light)',
            padding: '6px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent)'
          }}>💬</div>
          
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '3px' }}>
              {activeToast.senderName}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4, wordBreak: 'break-word' }}>
              {activeToast.messageText}
            </div>
          </div>
          
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setActiveToast(null);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '14px',
              padding: '0 4px',
              marginLeft: '4px'
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Actual Chat Window */}
      {isOpen && targetUser && (
        <div style={{
          position: 'fixed', bottom: '20px', right: '20px', width: '340px',
          background: 'var(--surface)', borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border)',
          boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden', zIndex: 1000,
          animation: 'modalIn 0.25s ease',
        }}>
          <div style={{
            padding: '14px 16px',
            borderBottom: '1px solid var(--border)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {targetUser.username}
              </div>
              <div style={{ fontSize: '11px', color: isConnected ? 'var(--success)' : 'var(--text-muted)', marginTop: '2px' }}>
                {isConnected ? t('chat.online') : t('chat.connecting')}
              </div>
            </div>
            <button onClick={onClose} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '18px', color: 'var(--text-muted)', padding: '4px',
              transition: 'color var(--transition)',
            }}>
              ✕
            </button>
          </div>

          <div style={{
            height: '320px', overflowY: 'auto', padding: '16px',
            background: 'var(--bg)',
            display: 'flex', flexDirection: 'column', gap: '8px',
          }}>
            {messages.length === 0 && (
              <div style={{
                textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', fontSize: '13px',
              }}>
                {t('chat.start_conversation')}
              </div>
            )}
            {messages.map((msg, index) => {
              const isMe = msg.nguoiGuiId === currentUser.id;
              return (
                <div key={msg.id || index} style={{
                  alignSelf: isMe ? 'flex-end' : 'flex-start',
                  maxWidth: '80%', opacity: msg.isOptimistic ? 0.6 : 1,
                  animation: 'fadeIn 0.15s ease',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <div style={{
                    background: isMe ? 'var(--accent)' : 'var(--surface)',
                    color: isMe ? '#fff' : 'var(--text-primary)',
                    padding: '9px 13px',
                    borderRadius: isMe ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                    fontSize: '13px', lineHeight: 1.5,
                    border: isMe ? 'none' : '1px solid var(--border)',
                  }}>
                    {msg.noiDung}
                  </div>
                  <div style={{
                    fontSize: '10px',
                    color: 'var(--text-muted)',
                    marginTop: '2px',
                    textAlign: isMe ? 'right' : 'left',
                    padding: '0 4px'
                  }}>
                    {formatTime(msg.thoiGianGui || msg.thoiGian)}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={sendMessage} style={{
            display: 'flex', padding: '12px',
            borderTop: '1px solid var(--border)', gap: '8px',
          }}>
            <input
              type="text" value={input} onChange={e => setInput(e.target.value)}
              placeholder={t('chat.placeholder')}
              disabled={!isConnected}
              style={{
                flex: 1, padding: '9px 14px', borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)', background: 'var(--bg)',
                color: 'var(--text-primary)', outline: 'none', fontSize: '13px',
                transition: 'border-color var(--transition)',
              }}
            />
            <button type="submit" disabled={!isConnected} style={{
              padding: '9px 16px', borderRadius: 'var(--radius-md)',
              border: 'none', background: isConnected ? 'var(--accent)' : 'var(--border)',
              color: '#fff', cursor: isConnected ? 'pointer' : 'not-allowed',
              fontWeight: 500, fontSize: '13px',
              transition: 'background var(--transition)',
            }}>
              {t('chat.btn_send')}
            </button>
          </form>
        </div>
      )}
    </>
  );
}

export default ChatBox;