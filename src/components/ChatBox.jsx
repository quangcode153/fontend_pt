import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import api from '../api';

function ChatBox({ currentUser, targetUser, isOpen, onClose }) {
  const { t } = useTranslation();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const stompClientRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    setMessages([]);
  }, [targetUser?.id]);

  useEffect(() => {
    if (!isOpen || !currentUser?.id || !targetUser?.id) return;

    api.get(`/tin-nhan/${currentUser.id}/${targetUser.id}`)
      .then(res => setMessages(res.data))
      .catch(err => console.error(t('chat.error_load'), err));

    const wsUrl = api.defaults.baseURL ? api.defaults.baseURL.replace('/api', '/ws') : 'http://localhost:8080/ws';

    const client = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      reconnectDelay: 5000,
      debug: (str) => console.log('STOMP: ' + str),
      onConnect: () => {
        setIsConnected(true);
        client.subscribe(`/topic/chat/${currentUser.id}`, (msg) => {
          const newMsg = JSON.parse(msg.body);
          // Kiểm tra xem tin nhắn này có thuộc về hội thoại hiện tại không
          if (newMsg.nguoiGuiId === targetUser.id || newMsg.nguoiNhanId === targetUser.id) {
            setMessages(prev => {
              // 1. Nếu đã có tin nhắn với ID này rồi thì bỏ qua
              if (prev.some(m => m.id === newMsg.id)) return prev;

              // 2. Nếu tin nhắn này là tin nhắn do chính mình gửi (nguoiGuiId === currentUser.id)
              // và đang có tin nhắn optimistic chờ sẵn, thì thay thế nó
              if (newMsg.nguoiGuiId === currentUser.id) {
                const optIndex = prev.findIndex(m => m.isOptimistic && m.noiDung === newMsg.noiDung);
                if (optIndex !== -1) {
                  const updated = [...prev];
                  updated[optIndex] = newMsg; // Thay bằng tin nhắn thật từ server (có ID)
                  return updated;
                }
              }

              // 3. Nếu là tin nhắn từ người khác gửi đến, hoặc không tìm thấy tin optimistic khớp
              return [...prev, newMsg];
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
  }, [isOpen, currentUser?.id, targetUser?.id]);

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

  if (!isOpen || !targetUser) return null;

  return (
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
  );
}

export default ChatBox;