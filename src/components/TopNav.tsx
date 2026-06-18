// TopNav.tsx - Slim institutional terminal top bar shared by the Dashboard and
// Analytics: wordmark, symbol tabs with live mids, page nav, feed status, user.

import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore, apiClient } from "../store/authStore";
import { useThemeStore } from "../store/themeStore";

interface TopNavProps {
  symbols: string[];
  selectedSymbol?: string;
  onSelectSymbol?: (s: string) => void;
  connected?: boolean;
}

export const TopNav = ({ symbols, selectedSymbol, onSelectSymbol, connected = false }: TopNavProps) => {
  const email = useAuthStore((s) => s.email);
  const logout = useAuthStore((s) => s.logout);
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggle);
  const navigate = useNavigate();
  const location = useLocation();
  const [mids, setMids] = useState<Record<string, number>>({});

  // Poll each symbol's mid so all tabs show a live price (the active symbol also
  // updates from the WebSocket feed via the page).
  useEffect(() => {
    let active = true;
    const load = async () => {
      const next: Record<string, number> = {};
      await Promise.all(
        symbols.map(async (s) => {
          try {
            const res = await apiClient.get(`/orderbook/${s}`);
            if (res.data?.mid) next[s] = res.data.mid;
          } catch {
            /* ignore */
          }
        })
      );
      if (active) setMids((prev) => ({ ...prev, ...next }));
    };
    load();
    const id = setInterval(load, 5000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [symbols.join(",")]);

  const onTerminal = location.pathname.startsWith("/dashboard");
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="flex items-center justify-between h-9 px-3 border-b border-line bg-bg shrink-0">
      <div className="flex items-center gap-5 h-full min-w-0">
        <span className="mono font-bold text-accent tracking-tight text-[15px] shrink-0">OMS</span>
        <nav className="flex h-full items-stretch min-w-0 overflow-x-auto">
          {symbols.map((s) => {
            const active = s === selectedSymbol;
            const mid = mids[s];
            const cls = `flex items-center px-3 border-b-2 transition-colors ${
              active ? "text-ink border-accent" : "text-outline border-transparent hover:bg-elev"
            }`;
            const inner = (
              <span className="flex items-center mono text-[12px]">
                {s}
                {mid ? (
                  <span className="ml-2 text-ink-2">
                    {mid.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </span>
                ) : null}
              </span>
            );
            return onSelectSymbol ? (
              <button key={s} className={cls} onClick={() => onSelectSymbol(s)}>
                {inner}
              </button>
            ) : (
              <Link key={s} to="/dashboard" className={cls}>
                {inner}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-4 h-full shrink-0">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className={`label-caps ${onTerminal ? "!text-accent" : "hover:!text-ink"}`}>
            Terminal
          </Link>
          <Link to="/analytics" className={`label-caps ${!onTerminal ? "!text-accent" : "hover:!text-ink"}`}>
            Analytics
          </Link>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-bid" : "bg-amber-400"}`} />
          <span className="label-caps" style={{ color: connected ? "#00c07e" : "#f0b90b" }}>
            {connected ? "LIVE" : "···"}
          </span>
        </div>
        <span className="mono text-[12px] text-outline hidden md:inline">{email}</span>
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
          className="flex items-center justify-center w-7 h-7 !text-outline hover:!text-ink hover:bg-elev"
        >
          <span className="material-symbols-outlined text-[18px]">
            {theme === 'dark' ? 'light_mode' : 'dark_mode'}
          </span>
        </button>
        <button
          onClick={handleLogout}
          className="label-caps !text-accent hover:bg-elev px-2 py-1 border border-line"
        >
          Sign out
        </button>
      </div>
    </header>
  );
};
