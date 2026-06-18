// TradeTape.tsx - Live time & sales tape streamed over the WebSocket feed.

import type { FeedTrade } from '../hooks/useMarketFeed';

interface TradeTapeProps {
  trades: FeedTrade[];
}

export const TradeTape = ({ trades }: TradeTapeProps) => {
  return (
    <div className="panel h-full">
      <div className="panel-header">
        <span className="label-caps">Trade Tape</span>
      </div>
      <div className="data-row grid-cols-[80px_1fr_1fr_56px] border-b border-line label-caps">
        <span>Time</span>
        <span className="text-right">Price</span>
        <span className="text-right">Size</span>
        <span className="text-right">Side</span>
      </div>
      <div className="flex-1 overflow-y-auto mono text-[12px] min-h-0">
        {trades.length === 0 ? (
          <div className="px-3 py-8 text-center text-muted text-[12px]">No trades yet — place an order to print the tape.</div>
        ) : (
          trades.map((t, i) => (
            <div key={i} className="data-row hoverable grid-cols-[80px_1fr_1fr_56px]">
              <span className="text-muted">{new Date(t.ts).toLocaleTimeString()}</span>
              <span className={`text-right ${t.side === 'BUY' ? 'text-bid' : 'text-ask'}`}>{t.price.toFixed(2)}</span>
              <span className="text-right text-ink-2">{t.size.toFixed(4)}</span>
              <span className={`text-right ${t.side === 'BUY' ? 'text-bid' : 'text-ask'}`}>{t.side}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
