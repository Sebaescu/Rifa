import { Ticket } from './raffle.model';
import { User } from './user.model';

export interface CartItem {
  id: number;
  ticket: Ticket;
  ticket_id: number;
  added_at: string;
}

export interface Cart {
  id: number;
  user: number;
  items: CartItem[];
  total_amount: number;
  item_count: number;
  created_at: string;
  updated_at: string;
}

export interface AddToCartRequest {
  ticket_id: number;
}

export interface Order {
  id: number;
  user: User;
  order_number: string;
  total_amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  payment_method?: string;
  payment_reference?: string;
  kushki_transaction_id?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  items: OrderItem[];
}

export interface OrderItem {
  id: number;
  ticket: Ticket;
  price: number;
  created_at: string;
}

export interface CheckoutRequest {
  payment_method: string;
}

export interface UserTickets {
  raffle: any;
  tickets: Ticket[];
}
