import { useEffect, useState } from 'react';
import { useTradingStore } from '../store/tradingStore';
import { useThemeStore } from '../store/themeStore';
import { TopNav } from '../components/TopNav';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

const SYMBOLS = ['BTC-USD', 'ETH-USD', 'SOL-USD'];

export const Analytics = () => {
  const { fetchAllTrades, fetchAnalytics, fetchTCA, trades, tca } = useTradingStore();
  const theme = useThemeStore((s) => s.theme);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);

  useEffect(() => {
    fetchAllTrades();
    fetchAnalytics();
    fetchTCA();
  }, []);

  const filteredTrades = selectedSymbol ? trades.filter((t) => t.symbol === selectedSymbol) : trades;
  const filledTrades = filteredTrades.filter((t) => t.status === 'FILLED');

  const stats = {
    totalTrades: filteredTrades.length,
    fillRate: filteredTrades.length > 0 ? ((filledTrades.length / filteredTrades.length) * 100).toFixed(1) : '0',
    totalQuantity: filledTrades.reduce((sum, t) => sum + (t.exec_qty || 0), 0).toFixed(4),
    avgSlippage:
      filledTrades.length > 0
        ? (filledTrades.reduce((sum, t) => sum + (t.slippage_bps || 0), 0) / filledTrades.length).toFixed(2)
        : '0',
    buyTrades: filteredTrades.filter((t) => t.side === 'BUY').length,
    sellTrades: filteredTrades.filter((t) => t.side === 'SELL').length,
  };

  const recent = filledTrades.slice(-30).reverse();
  const slippageChartData = {
    labels: recent.map((t) => new Date(t.exec_created_at || t.created_at).toLocaleTimeString()),
    datasets: [
      {
        label: 'Slippage (bps)',
        data: recent.map((t) => t.slippage_bps || 0),
        borderColor: '#4d8eff',
        backgroundColor: 'rgba(77,142,255,0.08)',
        tension: 0.3,
        fill: true,
        pointRadius: 0,
        borderWidth: 1.5,
      },
    ],
  };

  const buySellChartData = {
    labels: ['Buy', 'Sell'],
    datasets: [{ label: 'Count', data: [stats.buyTrades, stats.sellTrades], backgroundColor: ['#00c07e', '#ff5166'] }],
  };

  const gridColor = theme === 'light' ? '#e3e6ea' : '#232a33';
  const tickColor = theme === 'light' ? '#5c646f' : '#8c909f';
  const axis = { ticks: { color: tickColor, font: { size: 10 } }, grid: { color: gridColor } };
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: axis, x: axis },
  };

  const metric = (label: string, value: string, accent?: string) => (
    <div className="panel border border-line p-3">
      <div className="label-caps">{label}</div>
      <div className="mono text-[20px] mt-1" style={accent ? { color: accent } : undefined}>
        {value}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-bg text-ink">
      <TopNav symbols={SYMBOLS} connected />

      <main className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
        {/* Metric tiles */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-px bg-line border border-line">
          {metric('Total Trades', String(stats.totalTrades))}
          {metric('Fill Rate', `${stats.fillRate}%`, '#00c07e')}
          {metric('Total Qty', stats.totalQuantity)}
          {metric('Avg Slippage', `${stats.avgSlippage} bps`, '#f0b90b')}
          {metric('Buy / Sell', `${stats.buyTrades} / ${stats.sellTrades}`)}
        </div>

        {/* Symbol filter */}
        <div className="flex border border-line w-fit">
          {([null, ...SYMBOLS] as (string | null)[]).map((s, i) => (
            <button
              key={s ?? 'all'}
              onClick={() => setSelectedSymbol(s)}
              className={`seg px-4 ${i > 0 ? 'border-l border-line' : ''} ${selectedSymbol === s ? 'seg-active' : ''}`}
            >
              {s ?? 'ALL'}
            </button>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div className="panel border border-line">
            <div className="panel-header">
              <span className="label-caps">Slippage over time (bps)</span>
            </div>
            <div className="p-3" style={{ height: 240 }}>
              <Line data={slippageChartData} options={chartOptions} />
            </div>
          </div>
          <div className="panel border border-line">
            <div className="panel-header">
              <span className="label-caps">Buy vs Sell</span>
            </div>
            <div className="p-3" style={{ height: 240 }}>
              <Bar data={buySellChartData} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* TCA */}
        {tca.length > 0 && (
          <div className="panel border border-line">
            <div className="panel-header">
              <span className="label-caps">Transaction Cost Analysis</span>
            </div>
            <div className="data-row grid-cols-[1fr_1fr_1fr_1fr_1fr_1fr] border-b border-line label-caps">
              <span>Symbol</span>
              <span className="text-right">Filled Qty</span>
              <span className="text-right">Notional</span>
              <span className="text-right">Avg Fill</span>
              <span className="text-right">Avg Slippage</span>
              <span className="text-right">Exec Cost</span>
            </div>
            <div className="mono text-[12px]">
              {tca.map((t) => (
                <div key={t.symbol} className="data-row hoverable grid-cols-[1fr_1fr_1fr_1fr_1fr_1fr]">
                  <span className="font-semibold text-ink">{t.symbol}</span>
                  <span className="text-right text-ink-2">{t.filled_qty.toFixed(4)}</span>
                  <span className="text-right text-ink-2">${t.notional_usd.toFixed(2)}</span>
                  <span className="text-right text-ink-2">${t.avg_fill_price.toFixed(2)}</span>
                  <span className={`text-right ${t.avg_slippage_bps > 0 ? 'text-ask' : 'text-bid'}`}>
                    {t.avg_slippage_bps.toFixed(2)} bps
                  </span>
                  <span className={`text-right ${t.cost_usd > 0 ? 'text-ask' : 'text-bid'}`}>
                    ${t.cost_usd.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Trade history */}
        <div className="panel border border-line">
          <div className="panel-header">
            <span className="label-caps">Trade History</span>
          </div>
          {filteredTrades.length === 0 ? (
            <div className="px-3 py-8 text-center text-muted text-[12px]">No trades yet.</div>
          ) : (
            <>
              <div className="data-row grid-cols-[1fr_70px_90px_130px_1fr_1fr_1fr_90px] border-b border-line label-caps">
                <span>Symbol</span>
                <span>Side</span>
                <span className="text-right">Qty</span>
                <span className="pl-4">Status</span>
                <span className="text-right">Expected</span>
                <span className="text-right">Exec Price</span>
                <span className="text-right">Slippage</span>
                <span className="text-right">Time</span>
              </div>
              <div className="mono text-[12px]">
                {filteredTrades.map((t) => (
                  <div key={t.order_id} className="data-row hoverable grid-cols-[1fr_70px_90px_130px_1fr_1fr_1fr_90px]">
                    <span className="font-semibold text-ink">{t.symbol}</span>
                    <span className={t.side === 'BUY' ? 'text-bid' : 'text-ask'}>{t.side}</span>
                    <span className="text-right text-ink-2">{(t.exec_qty ?? t.quantity ?? 0).toFixed(4)}</span>
                    <span className="pl-4">
                      <span
                        className={`px-1.5 py-0.5 text-[10px] ${
                          t.status === 'FILLED'
                            ? 'bg-bid/10 text-bid'
                            : t.status === 'REJECTED'
                            ? 'bg-ask/10 text-ask'
                            : t.status === 'CANCELED'
                            ? 'bg-elev text-outline'
                            : 'bg-amber-400/10 text-amber-400'
                        }`}
                      >
                        {t.status}
                      </span>
                    </span>
                    <span className="text-right text-outline">{t.arrival_mid ? `$${t.arrival_mid.toFixed(2)}` : '—'}</span>
                    <span className="text-right text-ink-2">
                      {t.status === 'FILLED' && t.exec_price ? `$${t.exec_price.toFixed(2)}` : '—'}
                    </span>
                    <span className={`text-right ${(t.slippage_bps ?? 0) > 0 ? 'text-ask' : 'text-bid'}`}>
                      {t.status === 'FILLED' && t.slippage_bps != null ? `${t.slippage_bps.toFixed(1)} bps` : '—'}
                    </span>
                    <span className="text-right text-muted">{new Date(t.created_at).toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};
