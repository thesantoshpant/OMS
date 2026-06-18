// OrderBook.tsx - Live two-sided depth ladder (asks / mid / bids) with cumulative
// totals and depth bars. Presentational: the parent owns the WebSocket feed.

import { useEffect, useRef, useState } from "react";
import type { FeedBook } from "../hooks/useMarketFeed";

interface OrderBookProps {
  symbol: string;
  book: FeedBook | null;
  connected: boolean;
}

const fmt = (n: number, d = 2) =>
  n.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });

export const OrderBook = ({ symbol, book, connected }: OrderBookProps) => {
  const prevMid = useRef<number | null>(null);
  const [dir, setDir] = useState<"up" | "down">("up");

  useEffect(() => {
    if (book?.mid != null) {
      if (prevMid.current != null) {
        if (book.mid > prevMid.current) setDir("up");
        else if (book.mid < prevMid.current) setDir("down");
      }
      prevMid.current = book.mid;
    }
  }, [book?.mid]);

  if (!book || (book.bids.length === 0 && book.asks.length === 0)) {
    return (
      <div className="panel h-full">
        <div className="panel-header">
          <span className="label-caps">Order Book · {symbol}</span>
        </div>
        <div className="flex-1 flex items-center justify-center text-muted text-[12px]">
          {connected ? "Waiting for liquidity…" : "Connecting…"}
        </div>
      </div>
    );
  }

  let acc = 0;
  const asks = book.asks.map((l) => ({ ...l, total: (acc += l.size) }));
  const askMax = acc || 1;
  acc = 0;
  const bids = book.bids.map((l) => ({ ...l, total: (acc += l.size) }));
  const bidMax = acc || 1;

  const spread = book.asks.length && book.bids.length ? book.asks[0].price - book.bids[0].price : 0;
  const midColor = dir === "down" ? "text-ask" : "text-bid";

  return (
    <div className="panel h-full">
      <div className="panel-header">
        <span className="label-caps">Order Book · {symbol}</span>
        <div className="flex items-center gap-1">
          <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-bid" : "bg-amber-400"}`} />
          <span className="label-caps" style={{ color: connected ? "#00c07e" : "#f0b90b" }}>
            {connected ? "LIVE" : "···"}
          </span>
        </div>
      </div>

      <div className="data-row grid-cols-[1fr_1fr_1fr] border-b border-line label-caps">
        <span>Price</span>
        <span className="text-right">Size</span>
        <span className="text-right">Total</span>
      </div>

      {/* Asks (best ask nearest the mid via column-reverse) */}
      <div className="flex-1 overflow-y-auto flex flex-col-reverse mono text-[12px] min-h-0">
        {asks.map((l, i) => (
          <div key={i} className="data-row hoverable grid-cols-[1fr_1fr_1fr] relative">
            <div className="depth-bar bg-ask" style={{ right: 0, width: `${(l.total / askMax) * 100}%` }} />
            <span className="text-ask cell text-right">{fmt(l.price)}</span>
            <span className="text-right cell text-ink-2">{fmt(l.size, 4)}</span>
            <span className="text-right cell text-outline">{fmt(l.total, 3)}</span>
          </div>
        ))}
      </div>

      {/* Mid */}
      <div className="h-9 border-y border-line flex items-center justify-between px-3 bg-bg flex-none">
        <span className={`mono ${midColor} text-[15px] font-medium`}>{fmt(book.mid)}</span>
        <div className="flex items-center gap-2">
          <span className={`material-symbols-outlined text-[16px] ${midColor}`}>
            {dir === "down" ? "arrow_downward" : "arrow_upward"}
          </span>
          <span className="mono text-[12px] text-muted">Spread {fmt(spread)}</span>
        </div>
      </div>

      {/* Bids */}
      <div className="flex-1 overflow-y-auto mono text-[12px] min-h-0">
        {bids.map((l, i) => (
          <div key={i} className="data-row hoverable grid-cols-[1fr_1fr_1fr] relative">
            <div className="depth-bar bg-bid" style={{ right: 0, width: `${(l.total / bidMax) * 100}%` }} />
            <span className="text-bid cell text-right">{fmt(l.price)}</span>
            <span className="text-right cell text-ink-2">{fmt(l.size, 4)}</span>
            <span className="text-right cell text-outline">{fmt(l.total, 3)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
