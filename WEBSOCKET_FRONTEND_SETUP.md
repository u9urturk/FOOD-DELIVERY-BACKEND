# 🚀 WebSocket Frontend Setup Guide - React Vite

Bu rehber, Food Delivery Backend WebSocket sistemini React Vite projenizle entegre etmek için adım adım kurulum ve geliştirme kılavuzudur.

## 📋 Gereksinimler
- React 18+ 
- Vite
- Existing auth system (JWT token management)
- TypeScript (önerilen)

## 🔧 1. Kurulum

### Socket.IO Client Yükleyin
```bash
npm install socket.io-client
npm install --save-dev @types/socket.io-client  # TypeScript için
```

### Ek Utility Kütüphaneleri (Opsiyonel)
```bash
npm install react-hot-toast  # Notification için
npm install zustand         # State management (Redux alternatifi)
```

## 🏗️ 2. Proje Yapısı

```
src/
├── services/
│   └── websocket.ts         # WebSocket manager service
├── hooks/
│   ├── useWebSocket.ts      # WebSocket connection hook
│   ├── useSessionList.ts    # Session listesi hook
│   └── useSessionActions.ts # Session işlemleri hook
├── components/
│   ├── SessionList.tsx      # Active sessions list
│   ├── SessionItem.tsx      # Single session item
│   └── WebSocketStatus.tsx  # Connection status indicator
├── types/
│   └── websocket.ts         # WebSocket type definitions
└── utils/
    └── session.ts           # Session utility functions
```

## 🔐 3. WebSocket Manager Service

### `src/services/websocket.ts`
```typescript
import { io, Socket } from 'socket.io-client';

export interface WebSocketEvents {
  session_revoked: (data: { type: 'session_revoked', sessionId: string, reason: string }) => void;
  auth_error: (data: { type: 'auth_error', message: string }) => void;
  rate_limited: (data: { type: 'rate_limited', reason: string, limit: number }) => void;
}

export interface SessionData {
  sessionId: string;
  userId: string;
  deviceInfo?: string;
  lastActivity: string;
  current: boolean;
}

class WebSocketManager {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  
  connect(token: string) {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000', {
      path: '/ws',
      auth: { token },
      transports: ['websocket'],
      autoConnect: true,
      reconnectionDelayMax: 10000,
      reconnectionAttempts: this.maxReconnectAttempts
    });

    this.setupEventListeners();
    return this.socket;
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 WebSocket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error);
      this.reconnectAttempts++;
    });
  }

  on<T extends keyof WebSocketEvents>(event: T, callback: WebSocketEvents[T]) {
    this.socket?.on(event, callback);
  }

  off<T extends keyof WebSocketEvents>(event: T, callback?: WebSocketEvents[T]) {
    this.socket?.off(event, callback);
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
    this.reconnectAttempts = 0;
  }

  getStatus() {
    return {
      connected: this.socket?.connected || false,
      reconnectAttempts: this.reconnectAttempts
    };
  }
}

export const websocketManager = new WebSocketManager();
```

## 🪝 4. React Hooks

### `src/hooks/useWebSocket.ts`
```typescript
import { useEffect, useState } from 'react';
import { websocketManager } from '../services/websocket';
import { useAuthStore } from '../stores/authStore'; // Auth store'unuza göre ayarlayın

export function useWebSocket() {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { accessToken, logout } = useAuthStore(); // Kendi auth yapınız

  useEffect(() => {
    if (!accessToken) {
      websocketManager.disconnect();
      setConnected(false);
      return;
    }

    const socket = websocketManager.connect(accessToken);
    
    const handleConnect = () => {
      setConnected(true);
      setError(null);
    };

    const handleDisconnect = () => {
      setConnected(false);
    };

    const handleAuthError = (data: any) => {
      console.error('WebSocket auth error:', data);
      setError(data.message);
      logout(); // Force logout on auth error
    };

    const handleSessionRevoked = (data: any) => {
      console.log('Session revoked:', data);
      if (data.sessionId === getCurrentSessionId()) {
        logout();
        toast.error('Oturumunuz başka bir yerden sonlandırıldı');
      } else {
        toast.info('Bir oturumunuz sonlandırıldı');
        // Refresh session list
      }
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('auth_error', handleAuthError);
    socket.on('session_revoked', handleSessionRevoked);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('auth_error', handleAuthError);
      socket.off('session_revoked', handleSessionRevoked);
    };
  }, [accessToken, logout]);

  return { connected, error };
}

function getCurrentSessionId() {
  // JWT token'dan session ID çıkarın
  // veya localStorage'dan alın
  return localStorage.getItem('currentSessionId');
}
```

### `src/hooks/useSessionList.ts`
```typescript
import { useState, useEffect, useCallback } from 'react';
import { SessionData } from '../services/websocket';

export function useSessionList() {
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/auth/sessions', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch sessions');
      
      const data = await response.json();
      setSessions(data.sessions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  const revokeSession = useCallback(async (sessionId: string) => {
    try {
      const response = await fetch(`/api/auth/sessions/${sessionId}/revoke`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error('Failed to revoke session');
      
      // Remove from local state
      setSessions(prev => prev.filter(s => s.sessionId !== sessionId));
    } catch (err) {
      console.error('Failed to revoke session:', err);
    }
  }, []);

  const revokeAllOtherSessions = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/sessions/revoke-others', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error('Failed to revoke other sessions');
      
      // Keep only current session
      setSessions(prev => prev.filter(s => s.current));
    } catch (err) {
      console.error('Failed to revoke other sessions:', err);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return {
    sessions,
    loading,
    error,
    refreshSessions: fetchSessions,
    revokeSession,
    revokeAllOtherSessions
  };
}
```

## 🎨 5. UI Components

### `src/components/SessionList.tsx`
```typescript
import React from 'react';
import { useSessionList } from '../hooks/useSessionList';
import { SessionItem } from './SessionItem';

export function SessionList() {
  const { 
    sessions, 
    loading, 
    error, 
    refreshSessions, 
    revokeSession, 
    revokeAllOtherSessions 
  } = useSessionList();

  const otherSessions = sessions.filter(s => !s.current);

  if (loading) return <div>Oturumlar yükleniyor...</div>;
  if (error) return <div>Hata: {error}</div>;

  return (
    <div className="session-list">
      <div className="session-list-header">
        <h3>Aktif Oturumlar ({sessions.length})</h3>
        <button onClick={refreshSessions}>Yenile</button>
        {otherSessions.length > 0 && (
          <button 
            onClick={revokeAllOtherSessions}
            className="danger-button"
          >
            Diğer Tüm Oturumları Kapat ({otherSessions.length})
          </button>
        )}
      </div>

      <div className="session-list-items">
        {sessions.map(session => (
          <SessionItem
            key={session.sessionId}
            session={session}
            onRevoke={session.current ? undefined : () => revokeSession(session.sessionId)}
          />
        ))}
      </div>
    </div>
  );
}
```

### `src/components/SessionItem.tsx`
```typescript
import React from 'react';
import { SessionData } from '../services/websocket';

interface SessionItemProps {
  session: SessionData;
  onRevoke?: () => void;
}

export function SessionItem({ session, onRevoke }: SessionItemProps) {
  return (
    <div className={`session-item ${session.current ? 'current' : ''}`}>
      <div className="session-info">
        <div className="device-info">
          {session.deviceInfo || 'Bilinmeyen Cihaz'}
          {session.current && <span className="current-badge">Şu anki oturum</span>}
        </div>
        <div className="last-activity">
          Son aktivite: {new Date(session.lastActivity).toLocaleString()}
        </div>
      </div>
      
      {onRevoke && (
        <button onClick={onRevoke} className="revoke-button">
          Oturumu Kapat
        </button>
      )}
    </div>
  );
}
```

## 🎯 6. Kullanım Örneği

### Ana component'inizde:
```typescript
import React from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import { SessionList } from './components/SessionList';

function App() {
  const { connected, error } = useWebSocket();

  return (
    <div className="app">
      <header>
        WebSocket Status: {connected ? '🟢 Bağlı' : '🔴 Bağlı değil'}
        {error && <div className="error">Hata: {error}</div>}
      </header>
      
      <main>
        <SessionList />
      </main>
    </div>
  );
}
```

## 🔥 7. Environment Variables

`.env` dosyanıza ekleyin:
```env
VITE_API_URL=http://localhost:3000
VITE_WS_RECONNECT_ATTEMPTS=5
```

## 🚀 8. Geliştirme Adımları

1. **Kurulum** ✅
2. WebSocket service ve hooks oluştur
3. UI componentlerini tasarla ve stil ver
4. Auth sisteminizle entegre et  
5. Error handling ve loading states ekle
6. Toast notifications entegrasyonu
7. Responsive design optimizasyonu
8. Test ve debug

## 🛠️ 9. İsteğe Bağlı İyileştirmeler

- **Offline Detection:** `navigator.onLine` ile offline durumu
- **Heartbeat:** Periyodik ping-pong connection check
- **Sound Notifications:** Session revoked için ses bildirimi
- **Device Detection:** User-agent parsing ile cihaz bilgisi
- **Session Geolocation:** IP bazlı lokasyon gösterimi

Bu rehber ile React Vite projenizde tam özellikli session yönetimi sistemi kurabilirsiniz. Hangi bölümden başlamak istersiniz?