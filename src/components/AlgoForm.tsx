import { useState } from 'react';
import { useTradingStore } from '../store/tradingStore';
import type { AlgoRequest } from '../store/tradingStore';

interface AlgoFormProps {
  symbol: string;
  onStarted?: () => void;
}

const ALGOS: AlgoRequest['algo'][] = ['TWAP', 'VWAP', 'ICEBERG'];

export const AlgoForm = ({ symbol, onStarted }: AlgoFormProps) => {
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [algo, setAlgo] = useState<AlgoRequest['algo']>('TWAP');
  const [totalQty, setTotalQty] = useState('');
  const [slices, setSlices] = useState('5');
  const [durationSec, setDurationSec] = useState('30');
  const [started, setStarted] = useState<string | null>(null);
  const { submitAlgo, isLoading } = useTradingStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(totalQty);
    if (!qty || qty <= 0) return;
    setStarted(null);
    try {
      await submitAlgo({
        symbol,
        side,
        algo,
        total_qty: qty,
        slices: parseInt(slices, 10) || 1,
        duration_sec: parseInt(durationSec, 10) || 0,
      });
      setStarted(`${algo} ${side} ${qty} · ${slices} slices / ${durationSec}s`);
      setTotalQty('');
      onStarted?.();
    } catch {
      /* handled by store */
    }
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="label-caps">Algorithmic</span>
      </div>
      <form onSubmit={handleSubmit} className="p-3 flex flex-col gap-2">
        <div className="flex border border-line">
          <button
            type="button"
            onClick={() => setSide('BUY')}
            className={`flex-1 py-1 label-caps border-r border-line ${
              side === 'BUY' ? 'bg-bid/10 !text-bid' : 'bg-surface !text-outline hover:bg-elev'
            }`}
          >
            Buy
          </button>
          <button
            type="button"
            onClick={() => setSide('SELL')}
            className={`flex-1 py-1 label-caps ${side === 'SELL' ? 'bg-ask/10 !text-ask' : 'bg-surface !text-outline hover:bg-elev'}`}
          >
            Sell
          </button>
        </div>

        <div className="flex border border-line">
          {ALGOS.map((a, i) => (
            <button
              key={a}
              type="button"
              onClick={() => setAlgo(a)}
              className={`seg text-[10px] ${i < ALGOS.length - 1 ? 'border-r border-line' : ''} ${algo === a ? 'seg-active' : ''}`}
            >
              {a}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-outline text-[12px] w-16">Total Qty</span>
          <input className="term-input" type="number" step="0.0001" value={totalQty} onChange={(e) => setTotalQty(e.target.value)} placeholder="0.0000" required />
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-outline text-[12px] w-16">Slices</span>
          <input className="term-input" type="number" min="1" value={slices} onChange={(e) => setSlices(e.target.value)} />
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-outline text-[12px] w-16">Dur. (s)</span>
          <input className="term-input" type="number" min="0" value={durationSec} onChange={(e) => setDurationSec(e.target.value)} />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-1.5 text-[12px] font-semibold border border-accent bg-accent-strong !text-[#00285d] hover:brightness-110 disabled:opacity-50"
        >
          Start {algo}
        </button>
        {started && <div className="border border-bid/30 bg-bid/10 p-2 text-[11px] mono text-bid">{started}</div>}
      </form>
    </div>
  );
};
