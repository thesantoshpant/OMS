import { useState } from 'react';
import { useTradingStore } from '../store/tradingStore';
import type { TimeInForce } from '../store/tradingStore';

interface TradeFormProps {
  symbol: string;
  currentPrice: number;
  onSuccess?: () => void;
}

const LIMIT_TIFS: TimeInForce[] = ['GTC', 'IOC', 'FOK', 'POST_ONLY'];
const MARKET_TIFS: TimeInForce[] = ['IOC', 'FOK'];
const TIF_LABEL: Record<TimeInForce, string> = { GTC: 'GTC', IOC: 'IOC', FOK: 'FOK', POST_ONLY: 'POST' };

export const TradeForm = ({ symbol, currentPrice, onSuccess }: TradeFormProps) => {
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [type, setType] = useState<'MARKET' | 'LIMIT'>('LIMIT');
  const [tif, setTif] = useState<TimeInForce>('GTC');
  const [quantity, setQuantity] = useState('');
  const [limitPrice, setLimitPrice] = useState('');
  const { submitTrade, isLoading, error, lastOrder } = useTradingStore();

  const changeType = (next: 'MARKET' | 'LIMIT') => {
    setType(next);
    setTif(next === 'MARKET' ? 'IOC' : 'GTC');
  };

  const tifOptions = type === 'MARKET' ? MARKET_TIFS : LIMIT_TIFS;
  const qtyNum = parseFloat(quantity || '0');
  const refPx = type === 'LIMIT' && limitPrice ? parseFloat(limitPrice) : currentPrice;
  const value = (refPx || 0) * (qtyNum || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quantity || qtyNum <= 0) return;
    try {
      await submitTrade({
        symbol,
        side,
        type,
        tif,
        quantity: qtyNum,
        limit_price: type === 'LIMIT' ? parseFloat(limitPrice) : undefined,
      });
      setQuantity('');
      setLimitPrice('');
      onSuccess?.();
    } catch {
      /* handled by store */
    }
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="label-caps">Place Order</span>
      </div>
      <form onSubmit={handleSubmit} className="p-3 flex flex-col gap-2">
        {/* Side */}
        <div className="flex border border-line">
          <button
            type="button"
            onClick={() => setSide('BUY')}
            className={`flex-1 py-1.5 label-caps border-r border-line ${
              side === 'BUY' ? 'bg-bid/10 !text-bid' : 'bg-surface !text-outline hover:bg-elev'
            }`}
          >
            Buy
          </button>
          <button
            type="button"
            onClick={() => setSide('SELL')}
            className={`flex-1 py-1.5 label-caps ${
              side === 'SELL' ? 'bg-ask/10 !text-ask' : 'bg-surface !text-outline hover:bg-elev'
            }`}
          >
            Sell
          </button>
        </div>

        {/* Type */}
        <div className="flex border border-line">
          {(['LIMIT', 'MARKET'] as const).map((t, i) => (
            <button
              key={t}
              type="button"
              onClick={() => changeType(t)}
              className={`seg ${i === 0 ? 'border-r border-line' : ''} ${type === t ? 'seg-active' : ''}`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Time in force */}
        <div className="flex gap-1">
          {tifOptions.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setTif(opt)}
              className={`px-2 py-0.5 text-[10px] font-semibold tracking-wide border ${
                tif === opt
                  ? 'border-accent !text-accent bg-bg'
                  : 'border-line !text-outline bg-bg hover:bg-elev'
              }`}
            >
              {TIF_LABEL[opt]}
            </button>
          ))}
        </div>

        {/* Inputs */}
        {type === 'LIMIT' && (
          <div className="flex items-center justify-between gap-2">
            <span className="text-outline text-[12px] w-12">Price</span>
            <input
              className="term-input"
              type="number"
              step="0.01"
              value={limitPrice}
              onChange={(e) => setLimitPrice(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>
        )}
        <div className="flex items-center justify-between gap-2">
          <span className="text-outline text-[12px] w-12">Size</span>
          <input
            className="term-input"
            type="number"
            step="0.0001"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="0.0000"
            required
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-outline text-[12px]">Value</span>
          <span className="mono text-[12px] text-ink">
            ~{value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
          </span>
        </div>

        {/* Action */}
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-1.5 text-[13px] font-semibold mt-1 transition-all disabled:opacity-50 ${
            side === 'BUY' ? 'bg-bid !text-[#003822] hover:brightness-110' : 'bg-ask !text-[#5b0014] hover:brightness-110'
          }`}
        >
          {isLoading ? 'Submitting…' : `${side} ${symbol}`}
        </button>

        {/* Result / error */}
        {error && (
          <div className="border border-ask/40 bg-ask/10 p-2 text-[11px] mono text-ask break-words">{String(error)}</div>
        )}
        {lastOrder && (
          <div
            className={`border p-2 flex items-center justify-between text-[11px] mono ${
              lastOrder.filled_qty > 0 ? 'border-bid/30 bg-bid/10 text-bid' : 'border-accent/30 bg-accent/10 text-accent'
            }`}
          >
            <span>
              {lastOrder.status}
              {lastOrder.filled_qty > 0 ? ` · ${lastOrder.filled_qty.toFixed(4)} @ ${lastOrder.avg_price.toFixed(2)}` : ''}
            </span>
            {lastOrder.filled_qty > 0 && <span>{lastOrder.slippage_bps.toFixed(1)} bps</span>}
          </div>
        )}
      </form>
    </div>
  );
};
