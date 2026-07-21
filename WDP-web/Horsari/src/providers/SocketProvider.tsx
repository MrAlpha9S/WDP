import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { io, type Socket } from "socket.io-client";

import { useAuth } from "./AuthProvider";
import { TOKEN_KEY } from "../utils/constants";

// One socket connection for the whole app, established once a user is
// logged in. Replaces the ad-hoc per-role sockets that used to live in
// Admin/Index.tsx and Referee/Index.tsx (neither ever joined a room —
// they only drove the navbar's connected/disconnected dot). Each page
// attaches and filters its own listener via useSocket(), the same way
// the per-race RaceMonitorIndex.tsx sockets already do.

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

interface SocketContextValue {
    socket: Socket | null;
    connected: boolean;
}

const SocketContext = createContext<SocketContextValue>({ socket: null, connected: false });

export function SocketProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        if (!user) {
            setSocket(null);
            setConnected(false);
            return;
        }

        const s = io(SOCKET_URL, { withCredentials: true });

        s.on("connect", () => {
            setConnected(true);
            const token = localStorage.getItem(TOKEN_KEY) ?? "";
            s.emit("join_user", { token });
        });
        s.on("disconnect", () => setConnected(false));

        setSocket(s);

        return () => {
            s.disconnect();
            setSocket(null);
            setConnected(false);
        };
    }, [user?.id]);

    return (
        <SocketContext.Provider value={{ socket, connected }}>
            {children}
        </SocketContext.Provider>
    );
}

export function useSocket(): SocketContextValue {
    return useContext(SocketContext);
}
