import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the axios client the store talks to. vi.hoisted ensures the spies exist
// before the hoisted vi.mock factory runs.
const { post, get } = vi.hoisted(() => ({ post: vi.fn(), get: vi.fn() }));
vi.mock('./authStore', () => ({ apiClient: { post, get } }));

import { useTradingStore } from './tradingStore';

describe('tradingStore', () => {
  beforeEach(() => {
    post.mockReset();
    get.mockReset();
    useTradingStore.setState({ error: null, lastOrder: null });
  });

  it('submitTrade attaches a client_order_id when none is given', async () => {
    post.mockResolvedValue({ data: { order_id: 1, status: 'FILLED', filled_qty: 1, avg_price: 100, slippage_bps: 5 } });
    await useTradingStore.getState().submitTrade({ symbol: 'BTC-USD', side: 'BUY', type: 'MARKET', quantity: 1 });
    expect(post).toHaveBeenCalledWith('/trade/', expect.objectContaining({ client_order_id: expect.any(String) }));
  });

  it('submitTrade preserves a provided client_order_id', async () => {
    post.mockResolvedValue({ data: {} });
    await useTradingStore.getState().submitTrade({
      client_order_id: 'mine-123',
      symbol: 'BTC-USD',
      side: 'SELL',
      type: 'MARKET',
      quantity: 1,
    });
    expect(post).toHaveBeenCalledWith('/trade/', expect.objectContaining({ client_order_id: 'mine-123' }));
  });

  it('coerces an object error response into a string', async () => {
    post.mockRejectedValue({ response: { data: { message: 'denied' } } });
    await expect(
      useTradingStore.getState().submitTrade({ symbol: 'BTC-USD', side: 'BUY', type: 'MARKET', quantity: 1 })
    ).rejects.toBeTruthy();
    expect(typeof useTradingStore.getState().error).toBe('string');
  });

  it('cancelOrder posts symbol + order_id', async () => {
    post.mockResolvedValue({ data: {} });
    await useTradingStore.getState().cancelOrder('BTC-USD', 42);
    expect(post).toHaveBeenCalledWith('/trade/cancel', { symbol: 'BTC-USD', order_id: 42 });
  });
});
