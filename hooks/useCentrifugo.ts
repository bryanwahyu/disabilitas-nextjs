
import { useState, useEffect, useRef, useCallback } from 'react';
import { Centrifuge, Subscription, PublicationContext } from 'centrifuge';
import { env } from '@/lib/env';

const CENTRIFUGO_URL = env.centrifugoUrl;
const AUTH_TOKEN_KEY = env.authTokenKey;

export interface UseCentrifugoReturn {
  client: Centrifuge | null;
  connected: boolean;
  subscribe: (channel: string, onPublication: (ctx: PublicationContext) => void) => Subscription | null;
  publish: (channel: string, data: unknown) => Promise<void>;
}

export function useCentrifugo(): UseCentrifugoReturn {
  const [connected, setConnected] = useState(false);
  const clientRef = useRef<Centrifuge | null>(null);
  const subsRef = useRef<Map<string, Subscription>>(new Map());

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem(AUTH_TOKEN_KEY) : null;
    if (!token) return;

    const centrifuge = new Centrifuge(CENTRIFUGO_URL, {
      data: { token },
    });

    centrifuge.on('connected', () => {
      setConnected(true);
    });

    centrifuge.on('disconnected', () => {
      setConnected(false);
    });

    clientRef.current = centrifuge;
    centrifuge.connect();

    return () => {
      subsRef.current.forEach((sub) => {
        sub.unsubscribe();
        sub.removeAllListeners();
      });
      subsRef.current.clear();
      centrifuge.disconnect();
      clientRef.current = null;
      setConnected(false);
    };
  }, []);

  const subscribe = useCallback((channel: string, onPublication: (ctx: PublicationContext) => void): Subscription | null => {
    const client = clientRef.current;
    if (!client) return null;

    // Reuse existing subscription
    const existing = subsRef.current.get(channel);
    if (existing) {
      existing.on('publication', onPublication);
      return existing;
    }

    const sub = client.newSubscription(channel);
    sub.on('publication', onPublication);
    sub.subscribe();
    subsRef.current.set(channel, sub);
    return sub;
  }, []);

  const publish = useCallback(async (channel: string, data: unknown): Promise<void> => {
    const client = clientRef.current;
    if (!client) throw new Error('Not connected to Centrifugo');
    await client.publish(channel, data);
  }, []);

  return {
    client: clientRef.current,
    connected,
    subscribe,
    publish,
  };
}
