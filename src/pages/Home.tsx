import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import type { AuthStore } from '../store/authStore';

const features = [
  { icon: 'account_tree', title: 'Real CLOB Matching' },
  { icon: 'bar_chart', title: 'Live L2 Order Book' },
  { icon: 'schedule', title: 'TWAP · VWAP · Iceberg' },
  { icon: 'lan', title: 'FIX 4.4 Gateway' },
];

const asks = [
  { p: '64,212.50', s: '1.400', t: '8.230', w: 80 },
  { p: '64,205.00', s: '2.100', t: '6.760', w: 60 },
  { p: '64,201.00', s: '1.800', t: '3.805', w: 35 },
];
const bids = [
  { p: '64,210.50', s: '1.200', t: '1.200', w: 18 },
  { p: '64,207.50', s: '4.500', t: '5.700', w: 45 },
  { p: '64,205.00', s: '2.150', t: '7.850', w: 65 },
  { p: '64,200.50', s: '6.400', t: '14.250', w: 90 },
];

export const Home = () => {
  const navigate = useNavigate();
  const token = useAuthStore((state: AuthStore) => state.token);
  const userId = useAuthStore((state: AuthStore) => state.userId);
  const isAuthenticated = !!token && !!userId;

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard');
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col">
      <header className="flex items-center justify-between h-12 px-5 border-b border-line">
        <span className="mono font-bold text-accent text-[16px] tracking-tight">OMS</span>
        <div className="flex items-center gap-2">
          <Link to="/login" className="px-3 py-1.5 label-caps !text-outline hover:!text-ink">
            Log in
          </Link>
          <Link
            to="/signup"
            className="px-3 py-1.5 text-[12px] font-semibold bg-accent-strong !text-[#00285d] hover:brightness-110"
          >
            Sign up
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-16 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <h1 className="text-[40px] leading-[1.1] font-semibold tracking-tight">
            A matching-engine-backed crypto OMS
          </h1>
          <p className="text-ink-2 mt-5 max-w-lg leading-relaxed text-[14px]">
            Execute against a deterministic central limit order book — live L2 market data, pre-trade risk, positions
            &amp; P&amp;L, execution algorithms (TWAP / VWAP / Iceberg), and a FIX 4.4 gateway.
          </p>
          <div className="flex gap-3 mt-7">
            <Link
              to="/dashboard"
              className="px-5 py-2.5 text-[13px] font-semibold bg-accent-strong !text-[#00285d] hover:brightness-110"
            >
              Launch terminal
            </Link>
            <Link to="/login" className="px-5 py-2.5 text-[13px] font-semibold border border-line !text-ink hover:bg-elev">
              Sign in
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-line border border-line mt-10">
            {features.map((f) => (
              <div key={f.title} className="panel p-3">
                <span className="material-symbols-outlined text-accent text-[18px]">{f.icon}</span>
                <div className="label-caps mt-2 !text-ink-2">{f.title}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Order-book preview */}
        <div className="panel border border-line">
          <div className="panel-header">
            <span className="label-caps">BTC-PERP · USD</span>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-bid" />
              <span className="label-caps" style={{ color: '#00c07e' }}>
                LIVE
              </span>
            </div>
          </div>
          <div className="data-row grid-cols-[1fr_1fr_1fr] border-b border-line label-caps">
            <span>Price</span>
            <span className="text-right">Size</span>
            <span className="text-right">Total</span>
          </div>
          <div className="mono text-[12px]">
            {asks.map((r, i) => (
              <div key={i} className="data-row grid-cols-[1fr_1fr_1fr] relative">
                <div className="depth-bar bg-ask" style={{ right: 0, width: `${r.w}%` }} />
                <span className="text-ask cell text-right">{r.p}</span>
                <span className="text-right cell text-ink-2">{r.s}</span>
                <span className="text-right cell text-outline">{r.t}</span>
              </div>
            ))}
          </div>
          <div className="h-9 border-y border-line flex items-center justify-between px-3">
            <span className="mono text-bid text-[15px]">64,210.50</span>
            <span className="mono text-[12px] text-muted">Spread 0.10</span>
          </div>
          <div className="mono text-[12px]">
            {bids.map((r, i) => (
              <div key={i} className="data-row grid-cols-[1fr_1fr_1fr] relative">
                <div className="depth-bar bg-bid" style={{ right: 0, width: `${r.w}%` }} />
                <span className="text-bid cell text-right">{r.p}</span>
                <span className="text-right cell text-ink-2">{r.s}</span>
                <span className="text-right cell text-outline">{r.t}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};
