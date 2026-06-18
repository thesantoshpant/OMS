import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OrderBook } from './OrderBook';
import type { FeedBook } from '../hooks/useMarketFeed';

const book: FeedBook = {
  symbol: 'BTC-USD',
  mid: 100.5,
  asks: [
    { price: 101, size: 1 },
    { price: 102, size: 2 },
  ],
  bids: [
    { price: 100, size: 1.5 },
    { price: 99, size: 0.5 },
  ],
};

describe('OrderBook', () => {
  it('renders cumulative totals (running sum of size from the inside out)', () => {
    render(<OrderBook symbol="BTC-USD" book={book} connected />);
    // asks cumulative: 1.000, then 3.000 ; bids cumulative: 1.500, then 2.000
    expect(screen.getByText('3.000')).toBeInTheDocument();
    expect(screen.getByText('2.000')).toBeInTheDocument();
    // prices and mid render
    expect(screen.getByText('100.50')).toBeInTheDocument(); // mid
  });

  it('shows a connecting state when there is no book', () => {
    render(<OrderBook symbol="BTC-USD" book={null} connected={false} />);
    expect(screen.getByText(/Connecting/i)).toBeInTheDocument();
  });
});
