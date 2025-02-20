export type Profile = {
  id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Driver = {
  id: string;
  license_plate: string;
  vehicle_model: string;
  vehicle_color: string;
  driver_license: string;
  status: 'offline' | 'online' | 'on_ride';
  current_latitude: number | null;
  current_longitude: number | null;
  rating: number;
  created_at: string;
  updated_at: string;
};

export type Ride = {
  id: string;
  passenger_id: string;
  driver_id: string | null;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  pickup_latitude: number;
  pickup_longitude: number;
  destination_latitude: number;
  destination_longitude: number;
  pickup_address: string;
  destination_address: string;
  estimated_price: number;
  final_price: number | null;
  started_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Rating = {
  id: string;
  ride_id: string;
  from_id: string;
  to_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
};
