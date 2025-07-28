export interface Location {
  id: number;
  country: string;
  country_code: string;
  state?: string;
  city?: string;
  zip_code?: string;
  latitude?: number;
  longitude?: number;
}

export interface Raffle {
  id: number;
  name: string;
  description: string;
  ticket_price: number;
  total_tickets: number;
  start_date: string;
  end_date: string;
  status: 'active' | 'inactive' | 'completed' | 'cancelled';
  created_by: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
  };
  created_at: string;
  updated_at: string;
  image?: string;
  terms_conditions?: string;
  tickets_available: number;
  tickets_sold: number;
  // Geolocalización
  scope: 'provincial' | 'national' | 'international';
  allowed_locations: Location[];
  distance_km?: number; // Distancia calculada desde la ubicación del usuario
  // Propiedades del sorteo
  draw_date?: string; // Fecha cuando se realizó el sorteo
  winner_ticket?: number; // Número del ticket ganador
  winner_name?: string; // Nombre del ganador
  winner_email?: string; // Email del ganador
}

export interface Ticket {
  id: number;
  number: number;
  status: 'available' | 'reserved' | 'sold';
  purchased_by?: number;
  purchase_date?: string;
  reserved_until?: string;
  created_at: string;
  buyer?: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
  };
  raffle?: {
    id: number;
    name: string;
    description: string;
    ticket_price: number;
    image?: string;
    scope: string;
    tickets_available: number;
  };
}

export interface RaffleDetail extends Raffle {
  tickets: Ticket[];
}

export interface CreateRaffleRequest {
  name: string;
  description: string;
  ticket_price: number;
  total_tickets: number;
  start_date: string;
  end_date: string;
  image?: File;
  image_base64?: string;
  image_name?: string;
  terms_conditions?: string;
  scope: 'provincial' | 'national' | 'international';
  allowed_locations: any[];
}

export interface UserLocation {
  country: string;
  country_code: string;
  state?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
}
