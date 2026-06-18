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
    <div className="h-screen flex flex-col bg-bg text-ink overflow-hidden">
      <TopNav
        symbols={SYMBOLS}
        selectedSymbol={selectedSymbol}
        onSelectSymbol={setSelectedSymbol}
        connected={connected}
      />

      <div
        className="grid flex-1 min-h-0"
        style={{ gridTemplateColumns: '320px minmax(0, 1fr) 340px', gridTemplateRows: 'minmax(0, 1fr) 190px' }}
      >
        {/* Order book — left */}
        <div className="border-r border-line min-h-0 overflow-hidden" style={{ gridColumn: '1', gridRow: '1' }}>
          <OrderBook symbol={selectedSymbol} book={book} connected={connected} />
        </div>

        {/* Trade tape — center */}
        <div className="border-r border-line min-h-0 overflow-hidden" style={{ gridColumn: '2', gridRow: '1' }}>
          <TradeTape trades={trades} />
        </div>

        {/* Order entry + algo — right, single scrollable column */}
        <div className="min-h-0 overflow-y-auto flex flex-col" style={{ gridColumn: '3', gridRow: '1' }}>
          <div className="border-b border-line">
            <TradeForm symbol={selectedSymbol} currentPrice={currentPrice} onSuccess={handleOrderPlaced} />
          </div>
          <AlgoForm symbol={selectedSymbol} onStarted={handleOrderPlaced} />
        </div>

        {/* Positions / Open Orders / Fills — full width, bottom */}
        <div className="border-t border-line min-h-0 overflow-hidden" style={{ gridColumn: '1 / 4', gridRow: '2' }}>
          <BottomTabs refreshKey={refreshKey} />
        </div>
      </div>
    </div>
  );
};
