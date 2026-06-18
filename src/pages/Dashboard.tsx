import { useState } from 'react';
import { useTradingStore } from '../store/tradingStore';
import { useMarketFeed } from '../hooks/useMarketFeed';
import { TopNav } from '../components/TopNav';
import { OrderBook } from '../components/OrderBook';
import { TradeForm } from '../components/TradeForm';
import { AlgoForm } from '../components/AlgoForm';
import { TradeTape } from '../components/TradeTape';
import { BottomTabs } from '../components/BottomTabs';

const SYMBOLS = ['BTC-USD', 'ETH-USD', 'SOL-USD'];

export const Dashboard = () => {
  const [selectedSymbol, setSelectedSymbol] = useState('BTC-USD');
  const [refreshKey, setRefreshKey] = useState(0);
  const { fetchDashboardStats } = useTradingStore();

  const { book, trades, connected } = useMarketFeed(selectedSymbol);
  const currentPrice = book?.mid ?? 0;

  const handleOrderPlaced = () => {
    setRefreshKey((k) => k + 1);
    fetchDashboardStats();
  };

  return (
    <div className="dash-root bg-bg text-ink">
      <TopNav
        symbols={SYMBOLS}
        selectedSymbol={selectedSymbol}
        onSelectSymbol={setSelectedSymbol}
        connected={connected}
      />

      <div className="dash-body">
        {/* Order book — left */}
        <div
          className="border-b lg:border-b-0 lg:border-r border-line min-h-0 overflow-hidden h-[380px] lg:h-auto"
          style={{ gridColumn: '1', gridRow: '1' }}
        >
          <OrderBook symbol={selectedSymbol} book={book} connected={connected} />
        </div>

        {/* Trade tape — center */}
        <div
          className="border-b lg:border-b-0 lg:border-r border-line min-h-0 overflow-hidden h-[300px] lg:h-auto"
          style={{ gridColumn: '2', gridRow: '1' }}
        >
          <TradeTape trades={trades} />
        </div>

        {/* Order entry + algo — right. Flows full-height on mobile (page scrolls);
            scrolls internally on desktop. */}
        <div
          className="border-b lg:border-b-0 border-line min-h-0 flex flex-col lg:overflow-y-auto"
          style={{ gridColumn: '3', gridRow: '1' }}
        >
          <div className="border-b border-line shrink-0">
            <TradeForm symbol={selectedSymbol} currentPrice={currentPrice} onSuccess={handleOrderPlaced} />
          </div>
          <div className="shrink-0">
            <AlgoForm symbol={selectedSymbol} onStarted={handleOrderPlaced} />
          </div>
        </div>

        {/* Positions / Open Orders / Fills — full width, bottom */}
        <div
          className="border-t border-line min-h-0 overflow-hidden h-[420px] lg:h-auto"
          style={{ gridColumn: '1 / 4', gridRow: '2' }}
        >
          <BottomTabs refreshKey={refreshKey} />
        </div>
      </div>
    </div>
  );
};
