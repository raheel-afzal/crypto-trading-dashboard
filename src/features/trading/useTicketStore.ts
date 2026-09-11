import { create } from 'zustand';
import type { CoinSymbol } from '@/features/market/schemas';
import type { OrderType } from './schemas';

interface TicketState {
  symbol: CoinSymbol;
  type: OrderType;
  focusRequest: number;
  selectSymbol: (symbol: CoinSymbol) => void;
  selectType: (type: OrderType) => void;
  openTicket: (symbol: CoinSymbol, type: OrderType) => void;
}

export const useTicketStore = create<TicketState>()((set) => ({
  symbol: 'BTC',
  type: 'buy',
  focusRequest: 0,
  selectSymbol: (symbol) => set({ symbol }),
  selectType: (type) => set({ type }),
  openTicket: (symbol, type) => set((state) => ({ symbol, type, focusRequest: state.focusRequest + 1 })),
}));
