import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { WS_URL } from '@/lib/api/client';
import { coinHistoryQuery, coinsQuery } from './api';
import type { Coin, PricesMessage } from './schemas';

export type ConnectionStatus = 'connecting' | 'live' | 'reconnecting';

const HISTORY_LIMIT = 150;
const MAX_RETRY_DELAY_MS = 10_000;
const STALE_FRAME_MS = 8_000;

function isPricesMessage(value: unknown): value is PricesMessage {
  return (
    typeof value === 'object' &&
    value !== null &&
    'event' in value &&
    value.event === 'prices' &&
    'data' in value &&
    Array.isArray(value.data)
  );
}

export function useMarketSocket(): ConnectionStatus {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<ConnectionStatus>('connecting');

  useEffect(() => {
    let socket: WebSocket | undefined;
    let connectTimer: ReturnType<typeof setTimeout> | undefined;
    let staleTimer: ReturnType<typeof setTimeout> | undefined;
    let retries = 0;
    let frame = 0;
    let pending: Coin[][] = [];
    let disposed = false;

    // Ticks are buffered outside React and flushed once per animation frame.
    const flush = () => {
      frame = 0;
      const snapshots = pending;
      pending = [];
      for (const coins of snapshots) {
        for (const coin of coins) {
          queryClient.setQueryData(coinHistoryQuery(coin.symbol).queryKey, (history) =>
            !history || coin.updatedAt <= (history.at(-1)?.timestamp ?? '')
              ? history
              : [...history.slice(1 - HISTORY_LIMIT), { timestamp: coin.updatedAt, price: coin.price }],
          );
        }
      }
      queryClient.setQueryData(coinsQuery.queryKey, snapshots.at(-1));
    };

    // A half-open socket keeps reporting OPEN while frames stop arriving, so silence counts as a drop.
    const expectFrame = () => {
      clearTimeout(staleTimer);
      staleTimer = setTimeout(() => socket?.close(), STALE_FRAME_MS);
    };

    const connect = () => {
      socket = new WebSocket(WS_URL);

      socket.onopen = () => {
        // After an outage, drop buffered frames and resync everything the socket could not deliver.
        if (retries > 0) {
          pending = [];
          void queryClient.invalidateQueries();
        }
        retries = 0;
        expectFrame();
        setStatus('live');
      };

      socket.onmessage = (event: MessageEvent<string>) => {
        expectFrame();
        const message: unknown = JSON.parse(event.data);
        if (!isPricesMessage(message)) return;
        pending = [...pending.slice(1 - HISTORY_LIMIT), message.data];
        frame ||= requestAnimationFrame(flush);
      };

      socket.onclose = () => {
        clearTimeout(staleTimer);
        if (disposed) return;
        setStatus('reconnecting');
        connectTimer = setTimeout(connect, Math.min(1_000 * 2 ** retries, MAX_RETRY_DELAY_MS));
        retries += 1;
      };
    };

    // Deferred so StrictMode's immediate unmount cancels it before a socket opens.
    connectTimer = setTimeout(connect, 0);

    return () => {
      disposed = true;
      clearTimeout(connectTimer);
      clearTimeout(staleTimer);
      cancelAnimationFrame(frame);
      socket?.close();
    };
  }, [queryClient]);

  return status;
}
