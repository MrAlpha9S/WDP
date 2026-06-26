import { useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';

import { API_BASE_URL } from '../api/axios';
import { getSession } from '../auth/storage';

// ─── Shared types (mirror web's useRaceSocket) ────────────────────────────────

export interface LiveHorse {
  registrationId: string;
  number: number;
  horseName: string;
  jockeyName: string;
  raceStyle: string;
  currentDistance: number;
  currentSpeed: number;
  isFinished: boolean;
  finishPosition: number | null;
  finishTime: string | null;
}

export interface RaceUpdate {
  raceRoundId: string;
  elapsedSeconds: number;
  lineMark: number;
  trackLength: number;
  horses: LiveHorse[];
}

export interface FinishResult {
  registrationId: string;
  horseName: string;
  jockeyName: string;
  finishPosition: number | null;
  finishTime: string | null;
  distance?: number | null;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSpectatorRaceSocket(raceRoundId: string | null) {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [liveUpdate, setLiveUpdate] = useState<RaceUpdate | null>(null);
  const [finishResults, setFinishResults] = useState<FinishResult[] | null>(null);

  useEffect(() => {
    if (!raceRoundId || !API_BASE_URL) return;
    let mounted = true;

    const socket = io(API_BASE_URL, {
      transports: ['websocket'],
      reconnectionDelay: 3000,
      reconnectionAttempts: 5,
    });
    socketRef.current = socket;

    socket.on('connect', async () => {
      if (!mounted) return;
      setConnected(true);
      const session = await getSession();
      socket.emit('join_race', {
        raceRoundId,
        token: session?.accessToken ? `Bearer ${session.accessToken}` : '',
      });
    });

    socket.on('disconnect', () => {
      if (mounted) setConnected(false);
    });

    socket.on('race_update', (data: RaceUpdate) => {
      if (mounted) setLiveUpdate(data);
    });

    // race_finished payload: { raceRoundId, results: FinishResult[] }
    socket.on('race_finished', (data: { results: FinishResult[] }) => {
      if (mounted && Array.isArray(data?.results)) {
        setFinishResults(data.results);
      }
    });

    return () => {
      mounted = false;
      socket.disconnect();
      socketRef.current = null;
    };
  }, [raceRoundId]);

  return { connected, liveUpdate, finishResults };
}
