import { useEffect, useRef, useState } from "react";
import { WS_BASE_URL } from "../store/authStore";

export interface FeedLevel {
  price: number;
  size: number;
}

export interface FeedBook {
  symbol: string;
  mid: number;
  bids: FeedLevel[];
  asks: FeedLevel[];
}

export interface FeedTrade {
  symbol: string;
  price: number;
  size: number;
  side: string; // aggressor
  ts: number;
}

// useMarketFeed opens a WebSocket to the live order-book + trade-tape stream for
// a symbol. It auto-reconnects and keeps the most recent 50 trades.
export function useMarketFeed(symbol: string) {
  const [book, setBook] = useState<FeedBook | null>(null);
  const [trades, setTrades] = useState<FeedTrade[]>([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    setBook(null);
    setTrades([]);
    let closedByUs = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;

    const connect = () => {
      const ws = new WebSocket(`${WS_BASE_URL}/ws/${symbol}`);
      wsRef.current = ws;

      ws.onopen = () => setConnected(true);

      ws.onclose = () => {
        setConnected(false);
        if (!closedByUs) {
          reconnectTimer = setTimeout(connect, 2000);
        }
      };

      ws.onerror = () => ws.close();

      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          if (msg.type === "book") {
            setBook({
              symbol: msg.symbol,
              mid: msg.mid,
              bids: msg.bids ?? [],
              asks: msg.asks ?? [],
            });
          } else if (msg.type === "trade") {
            setTrades((prev) =>
              [
                {
                  symbol: msg.symbol,
                  price: msg.price,
                  size: msg.size,
                  side: msg.side,
                  ts: msg.ts,
                },
                ...prev,
              ].slice(0, 50)
            );
          }
        } catch {
          // ignore malformed frames
        }
      };
    };

    connect();

    return () => {
      closedByUs = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      wsRef.current?.close();
    };
  }, [symbol]);

  return { book, trades, connected };
}
