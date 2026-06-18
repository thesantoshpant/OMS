// BottomTabs.tsx - Tabbed strip at the bottom of the terminal: Positions (with
// mark-to-market P&L and one-click close), Open Orders (with cancel), and Fills.
// Centralizes /me/positions + /me/orders so the tab labels can show live counts.

import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '../store/authStore';
import { useTradingStore } from '../store/tradingStore';
import type { AnalyticsTrade } from '../store/tradingStore';

interface PositionView {
  symbol: string;
  qty: number;
  avg_price: number;
  mid: number;
  realized_pnl: number;
  unrealized_pnl: number;
}

interface BottomTabsProps {
  refreshKey?: number;
}

type Tab = 'positions' | 'orders' | 'fills';
const OPEN = ['WORKING', 'PARTIALLY_FILLED'];

const money = (v: number) => `${v < 0 ? '-' : ''}$${Math.abs(v).toFixed(2)}`;
const pnlCls = (v: number) => (v > 0 ? 'text-bid' : v < 0 ? 'text-ask' : 'text-outline');

const dedupe = (list: AnalyticsTrade[]) => {
  const seen = new Set<number>();
  return list.filter((o) => (seen.has(o.order_id) ? false : (seen.add(o.order_id), true)));
};

export const BottomTabs = ({ refreshKey }: BottomTabsProps) => {
  const [tab, setTab] = useState<Tab>('positions');
  const [orders, setOrders] = useState<AnalyticsTrade[]>([]);
  const [positions, setPositions] = useState<PositionView[]>([]);
  const [busy, setBusy] = useState<number | null>(null);
  const cancelOrder = useTradingStore((s) => s.cancelOrder);
  const submitTrade = useTradingStore((s) => s.submitTrade);

  const load = useCallback(async () => {
    try {
      const r = await apiClient.get('/me/orders');
      setOrders(r.data ?? []);
    } catch {
      /* ignore */
    }
    try {
      const r = await apiClient.get('/me/positions');
      setPositions(r.data ?? []);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 8000);
    return () => clearInterval(id);
  }, [load, refreshKey]);

  const openOrders = dedupe(orders.filter((o) => OPEN.includes(o.status)));
  const fills = dedupe(orders.filter((o) => o.status === 'FILLED')).slice(0, 60);
  const totRealized = positions.reduce((s, p) => s + p.realized_pnl, 0);
  const totUnreal = positions.reduce((s, p) => s + p.unrealized_pnl, 0);

  const handleCancel = async (o: AnalyticsTrade) => {
    setBusy(o.order_id);
    try {
      await cancelOrder(o.symbol, o.order_id);
      await load();
    } catch {
      /* surfaced by store */
    } finally {
      setBusy(null);
    }
  };

  const handleClose = async (p: PositionView) => {
    setBusy(-1);
    try {
      await submitTrade({
        symbol: p.symbol,
        side: p.qty > 0 ? 'SELL' : 'BUY',
        type: 'MARKET',
        tif: 'IOC',
        quantity: Math.abs(p.qty),
      });
      await load();
    } catch {
      /* surfaced by store */
    } finally {
      setBusy(null);
    }
  };

  const tabBtn = (id: Tab, label: string) => (
    <button
      onClick={() => setTab(id)}
      className={`px-4 py-2 label-caps border-b-2 ${
        tab === id ? '!text-accent border-accent' : 'border-transparent hover:!text-ink'
      }`}
    >
      {label}
    </button>
  );

  const head = (cols: string, items: string[]) => (
    <div className="data-row border-b border-line label-caps" style={{ gridTemplateColumns: cols }}>
      {items.map((h, i) => (
        <span key={i} className={i === 0 ? '' : 'text-right'}>
          {h}
        </span>
      ))}
    </div>
  );

  const pill = (status: string) => {
    const cls =
      status === 'FILLED'
        ? 'bg-bid/10 text-bid'
        : status === 'REJECTED'
        ? 'bg-ask/10 text-ask'
        : status === 'CANCELED'
        ? 'bg-elev text-outline'
        : 'bg-amber-400/10 text-amber-400';
    return <span className={`px-1.5 py-0.5 text-[10px] ${cls}`}>{status}</span>;
  };

  const empty = (text: string) => <div className="px-3 py-8 text-center text-muted text-[12px]">{text}</div>;

  const posCols = '120px 90px 110px 110px 110px 110px 1fr';
  const ordCols = '120px 70px 80px 110px 110px 110px 1fr';
  const fillCols = '120px 70px 110px 110px 110px 1fr';

  return (
    <div className="panel h-full">
      <div className="flex border-b border-line bg-bg items-center">
        {tabBtn('positions', 'Positions')}
        {tabBtn('orders', `Open Orders (${openOrders.length})`)}
        {tabBtn('fills', 'Fills')}
        {tab === 'positions' && (
          <div className="ml-auto pr-3 hidden sm:flex gap-4 text-[11px] mono">
            <span className="text-outline">
              Realized <span className={pnlCls(totRealized)}>{money(totRealized)}</span>
            </span>
            <span className="text-outline">
              Unrealized <span className={pnlCls(totUnreal)}>{money(totUnreal)}</span>
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto min-h-0">
        {tab === 'positions' &&
          (positions.length === 0 ? (
            empty('No open positions.')
          ) : (
            <div className="min-w-[760px]">
              {head(posCols, ['Symbol', 'Size', 'Entry', 'Mark', 'uPnL', 'rPnL', ''])}
              <div className="mono text-[12px]">
                {positions.map((p) => (
                  <div key={p.symbol} className="data-row hoverable" style={{ gridTemplateColumns: posCols }}>
                    <span className="font-semibold text-ink">{p.symbol}</span>
                    <span className={`text-right ${p.qty >= 0 ? 'text-bid' : 'text-ask'}`}>
                      {p.qty >= 0 ? '+' : ''}
                      {p.qty.toFixed(4)}
                    </span>
                    <span className="text-right text-ink-2">{p.avg_price.toFixed(2)}</span>
                    <span className="text-right text-ink-2">{p.mid.toFixed(2)}</span>
                    <span className={`text-right ${pnlCls(p.unrealized_pnl)}`}>{money(p.unrealized_pnl)}</span>
                    <span className={`text-right ${pnlCls(p.realized_pnl)}`}>{money(p.realized_pnl)}</span>
                    <span className="flex justify-end pr-2">
                      <button
                        onClick={() => handleClose(p)}
                        disabled={busy === -1}
                        className="text-[10px] border border-line px-2 py-0.5 hover:bg-elev !text-ink disabled:opacity-50"
                      >
                        CLOSE
                      </button>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}

        {tab === 'orders' &&
          (openOrders.length === 0 ? (
            empty('No open orders.')
          ) : (
            <div className="min-w-[760px]">
              {head(ordCols, ['Symbol', 'Side', 'Type', 'Limit', 'Remaining', 'Status', ''])}
              <div className="mono text-[12px]">
                {openOrders.map((o) => (
                  <div key={o.order_id} className="data-row hoverable" style={{ gridTemplateColumns: ordCols }}>
                    <span className="font-semibold text-ink">{o.symbol}</span>
                    <span className={o.side === 'BUY' ? 'text-bid' : 'text-ask'}>{o.side}</span>
                    <span className="text-outline">{o.type}</span>
                    <span className="text-right text-ink-2">{o.limit_price ? o.limit_price.toFixed(2) : '—'}</span>
                    <span className="text-right text-ink-2">{(o.remaining_qty ?? o.quantity ?? 0).toFixed(4)}</span>
                    <span>{pill(o.status)}</span>
                    <span className="flex justify-end pr-2">
                      <button
                        onClick={() => handleCancel(o)}
                        disabled={busy === o.order_id}
                        className="text-[10px] border border-line px-2 py-0.5 hover:bg-elev !text-ask disabled:opacity-50"
                      >
                        CANCEL
                      </button>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}

        {tab === 'fills' &&
          (fills.length === 0 ? (
            empty('No fills yet.')
          ) : (
            <div className="min-w-[760px]">
              {head(fillCols, ['Symbol', 'Side', 'Qty', 'Exec Price', 'Slippage', 'Time'])}
              <div className="mono text-[12px]">
                {fills.map((o) => (
                  <div key={o.order_id} className="data-row hoverable" style={{ gridTemplateColumns: fillCols }}>
                    <span className="font-semibold text-ink">{o.symbol}</span>
                    <span className={o.side === 'BUY' ? 'text-bid' : 'text-ask'}>{o.side}</span>
                    <span className="text-right text-ink-2">{(o.exec_qty ?? o.quantity ?? 0).toFixed(4)}</span>
                    <span className="text-right text-ink-2">{o.exec_price ? o.exec_price.toFixed(2) : '—'}</span>
                    <span className={`text-right ${(o.slippage_bps ?? 0) > 0 ? 'text-ask' : 'text-bid'}`}>
                      {o.slippage_bps != null ? `${o.slippage_bps.toFixed(1)} bps` : '—'}
                    </span>
                    <span className="text-right text-muted">
                      {new Date(o.exec_created_at ?? o.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};
