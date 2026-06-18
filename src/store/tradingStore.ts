import { create } from "zustand";
import { apiClient } from "./authStore";

export interface OrderLevel {
  side: "BID" | "ASK";
  price: number;
  size: number;
}

export interface OrderBook {
  symbol: string;
  mid: number;
  bids: OrderLevel[];
  asks: OrderLevel[];
}

export type TimeInForce = "GTC" | "IOC" | "FOK" | "POST_ONLY";

export interface TradeRequest {
  client_order_id?: string;
  symbol: string;
  side: "BUY" | "SELL";
  type: "MARKET" | "LIMIT";
  tif?: TimeInForce;
  quantity: number;
  limit_price?: number;
}

export interface OrderResponse {
  order_id: number;
  client_order_id?: string;
  symbol: string;
  side: string;
  type: string;
  tif: string;
  quantity: number;
  filled_qty: number;
  avg_price: number;
  arrival_mid: number;
  slippage_bps: number;
  status: string;
  duplicate?: boolean;
}

export interface AnalyticsTrade {
  order_id: number;
  symbol: string;
  side: string;
  type: string;
  quantity: number;
  remaining_qty?: number;
  limit_price?: number;
  status: string;
  arrival_mid?: number;
  created_at: string;
  updated_at: string;
  exec_id?: number;
  exec_price?: number;
  exec_qty?: number;
  slippage_bps?: number;
  exec_created_at?: string;
}

export interface SymbolStats {
  symbol: string;
  trades: number;
  total_qty: number;
  buy_qty: number;
  sell_qty: number;
  net_qty: number;
  avg_exec_price: number;
  avg_slippage_usd: number;
  avg_slippage_bps: number;
}

interface DashboardStats {
  open_orders: number;
  portfolio_value: number;
}

export interface AlgoRequest {
  symbol: string;
  side: "BUY" | "SELL";
  algo: "TWAP" | "VWAP" | "ICEBERG";
  total_qty: number;
  slices: number;
  duration_sec: number;
}

export interface SymbolTCA {
  symbol: string;
  filled_qty: number;
  notional_usd: number;
  avg_fill_price: number;
  avg_slippage_bps: number;
  cost_usd: number;
}

interface TradingStore {
  orderBook: OrderBook | null;
  selectedSymbol: string | null;
  selectedSide: "BUY" | "SELL" | null;
  isLoading: boolean;
  error: string | null;
  trades: AnalyticsTrade[];
  stats: SymbolStats | null;
  lastOrder: OrderResponse | null;
  dashboardStats: DashboardStats | null;
  tca: SymbolTCA[];

  setSelectedSymbol: (symbol: string) => void;
  setSelectedSide: (side: "BUY" | "SELL") => void;
  fetchOrderBook: (symbol: string) => Promise<void>;
  submitTrade: (trade: TradeRequest) => Promise<void>;
  cancelOrder: (symbol: string, orderId: number) => Promise<void>;
  submitAlgo: (req: AlgoRequest) => Promise<void>;
  fetchAnalytics: () => Promise<void>;
  fetchAllTrades: () => Promise<void>;
  fetchDashboardStats: () => Promise<void>;
  fetchTCA: () => Promise<void>;
  clearError: () => void;
}

export const useTradingStore = create<TradingStore>((set) => ({
  orderBook: null,
  selectedSymbol: null,
  selectedSide: null,
  isLoading: false,
  error: null,
  trades: [],
  stats: null,
  lastOrder: null,
  dashboardStats: null,
  tca: [],

  setSelectedSymbol: (symbol: string) => set({ selectedSymbol: symbol }),
  setSelectedSide: (side: "BUY" | "SELL") => set({ selectedSide: side }),
  fetchOrderBook: async (symbol: string) => {
    set({ isLoading: true, error: null });
    try {
      // Use the dedicated GET endpoint
      const response = await apiClient.get(`/orderbook/${symbol}`);

      set({
        orderBook: response.data,
        isLoading: false,
      });
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.message || "Failed to fetch order book";
      set({ error: errorMsg, isLoading: false });
      // Optional: Don't throw if you want the UI to just show error state
      // throw err;
    }
  },

  submitTrade: async (trade: TradeRequest) => {
    set({ isLoading: true, error: null });
    try {
      // Attach an idempotency key so a retried/double-clicked submit is a no-op.
      const body: TradeRequest = {
        ...trade,
        client_order_id: trade.client_order_id ?? crypto.randomUUID(),
      };
      const response = await apiClient.post("/trade/", body);
      set({
        lastOrder: response.data,
        isLoading: false,
      });
    } catch (err: any) {
      const data = err.response?.data;
      const errorMsg =
        typeof data === "string" ? data : data?.message || err.message || "Trade submission failed";
      set({ error: errorMsg, isLoading: false });
      throw err;
    }
  },

  cancelOrder: async (symbol: string, orderId: number) => {
    try {
      await apiClient.post("/trade/cancel", { symbol, order_id: orderId });
    } catch (err: any) {
      const data = err.response?.data;
      const errorMsg =
        typeof data === "string" ? data : data?.message || err.message || "Cancel failed";
      set({ error: errorMsg });
      throw err;
    }
  },

  fetchAnalytics: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get("/me/analytics");
      set({
        // FIX: Handle case where backend returns null for empty stats
        stats: response.data.stats || response.data || null,
        isLoading: false,
      });
    } catch (err: any) {
      const data = err.response?.data;
      const errorMsg =
        typeof data === "string" ? data : err.message || "Failed to fetch analytics";
      set({ error: errorMsg, isLoading: false });
      // Don't throw, just let UI show error or empty state
    }
  },

  fetchAllTrades: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get("/me/orders");
      set({
        // FIX: Default to [] if response.data is null (happens on fresh account)
        trades: response.data || [],
        isLoading: false,
      });
    } catch (err: any) {
      const data = err.response?.data;
      const errorMsg =
        typeof data === "string" ? data : err.message || "Failed to fetch trades";
      set({ error: errorMsg, isLoading: false });
    }
  },

  fetchDashboardStats: async () => {
    try {
      // This endpoint was missing in backend, we will add it now
      const response = await apiClient.get("/me/stats");
      set({
        dashboardStats: response.data,
      });
    } catch (err: any) {
      console.error("Failed to fetch dashboard stats:", err);
    }
  },

  submitAlgo: async (req: AlgoRequest) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.post("/trade/algo", req);
      set({ isLoading: false });
    } catch (err: any) {
      const data = err.response?.data;
      const errorMsg =
        typeof data === "string" ? data : data?.message || err.message || "Algo start failed";
      set({ error: errorMsg, isLoading: false });
      throw err;
    }
  },

  fetchTCA: async () => {
    try {
      const response = await apiClient.get("/me/tca");
      set({ tca: response.data ?? [] });
    } catch {
      // leave previous TCA on transient error
    }
  },

  clearError: () => set({ error: null }),
}));
