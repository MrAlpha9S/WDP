import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, type Socket } from 'socket.io-client';

import { API_BASE_URL } from '../api/axios';
import { useAuth } from '../auth/AuthContext';

// One socket connection for the whole app, established once a session
// exists. Deliberately a thin wrapper — it doesn't do any event routing
// itself; each screen attaches (and filters) its own listener on the raw
// socket via useSocket(), the same way the web app's per-screen sockets do.
// Race-live data still goes through the separate, race-scoped
// useSpectatorRaceSocket hook — this connection is for the lightweight
// 'notification_created' trigger-then-refetch events plus any global
// broadcasts (e.g. 'tournament:status_changed').

interface SocketContextValue {
  socket: Socket | null;
  connected: boolean;
}

const SocketContext = createContext<SocketContextValue>({ socket: null, connected: false });

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!session?.accessToken || !API_BASE_URL) {
      setSocket(null);
      setConnected(false);
      return;
    }

    let mounted = true;
    const s = io(API_BASE_URL, {
      transports: ['websocket'],
      reconnectionDelay: 3000,
      reconnectionAttempts: 5,
    });

    s.on('connect', () => {
      if (!mounted) return;
      setConnected(true);
      s.emit('join_user', { token: `Bearer ${session.accessToken}` });
    });

    s.on('disconnect', () => {
      if (mounted) setConnected(false);
    });

    setSocket(s);

    return () => {
      mounted = false;
      s.disconnect();
      setSocket(null);
      setConnected(false);
    };
  }, [session?.accessToken]);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket(): SocketContextValue {
  return useContext(SocketContext);
}
