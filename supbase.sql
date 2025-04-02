-- Create enum for ride status
CREATE TYPE public.ride_status AS ENUM ('pending', 'accepted', 'in_progress', 'completed', 'cancelled');

-- Create profiles table for storing user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create drivers table
CREATE TABLE public.drivers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  license_plate TEXT NOT NULL,
  vehicle_model TEXT NOT NULL,
  vehicle_color TEXT NOT NULL,
  driver_license TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'offline' CHECK (status IN ('offline', 'online', 'on_ride')),
  current_latitude DOUBLE PRECISION,
  current_longitude DOUBLE PRECISION,
  rating DOUBLE PRECISION DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create rides table
CREATE TABLE public.rides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  passenger_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status ride_status NOT NULL DEFAULT 'pending',
  pickup_latitude DOUBLE PRECISION NOT NULL,
  pickup_longitude DOUBLE PRECISION NOT NULL,
  destination_latitude DOUBLE PRECISION NOT NULL,
  destination_longitude DOUBLE PRECISION NOT NULL,
  pickup_address TEXT NOT NULL,
  destination_address TEXT NOT NULL,
  estimated_price DOUBLE PRECISION NOT NULL,
  final_price DOUBLE PRECISION,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create ratings table
CREATE TABLE public.ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  from_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create ride_logs table for keeping track of ride history (for analytics)
CREATE TABLE public.ride_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL,
  driver_id UUID,
  passenger_id UUID NOT NULL,
  pickup_address TEXT NOT NULL,
  destination_address TEXT NOT NULL,
  pickup_latitude DOUBLE PRECISION NOT NULL,
  pickup_longitude DOUBLE PRECISION NOT NULL,
  destination_latitude DOUBLE PRECISION NOT NULL,
  destination_longitude DOUBLE PRECISION NOT NULL,
  estimated_price DOUBLE PRECISION NOT NULL,
  final_price DOUBLE PRECISION,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ride_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create RLS policies for drivers
CREATE POLICY "Drivers can view their own data" ON public.drivers
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Drivers can update their own data" ON public.drivers
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Drivers can insert their own data" ON public.drivers
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "All users can view drivers" ON public.drivers
  FOR SELECT USING (true);

-- Create RLS policies for rides
CREATE POLICY "Passengers can view their own rides" ON public.rides
  FOR SELECT USING (auth.uid() = passenger_id);

CREATE POLICY "Drivers can view rides assigned to them" ON public.rides
  FOR SELECT USING (auth.uid() = driver_id);

CREATE POLICY "Drivers can view available rides" ON public.rides
  FOR SELECT USING (status = 'pending' AND driver_id IS NULL);

CREATE POLICY "Passengers can create their own rides" ON public.rides
  FOR INSERT WITH CHECK (auth.uid() = passenger_id);

CREATE POLICY "Passengers can update their own rides" ON public.rides
  FOR UPDATE USING (auth.uid() = passenger_id);

CREATE POLICY "Drivers can update their assigned rides" ON public.rides
  FOR UPDATE USING (auth.uid() = driver_id);

-- Create RLS policies for ratings
CREATE POLICY "Users can view all ratings" ON public.ratings
  FOR SELECT USING (true);

CREATE POLICY "Users can create ratings for rides they were involved in" ON public.ratings
  FOR INSERT WITH CHECK (
    auth.uid() = from_id AND 
    EXISTS (
      SELECT 1 FROM public.rides 
      WHERE id = ride_id AND (passenger_id = auth.uid() OR driver_id = auth.uid())
    )
  );

-- Create RLS policies for ride_logs
CREATE POLICY "Admins and involved users can view ride logs" ON public.ride_logs
  FOR SELECT USING (
    auth.uid() = passenger_id OR auth.uid() = driver_id
  );

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.drivers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rides;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ratings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ride_logs;

-- Create triggers to update the updated_at column
CREATE OR REPLACE FUNCTION public.trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER set_updated_at_profiles
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

CREATE TRIGGER set_updated_at_drivers
BEFORE UPDATE ON public.drivers
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

CREATE TRIGGER set_updated_at_rides
BEFORE UPDATE ON public.rides
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- Create trigger to create a profile when a user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, phone, avatar_url)
  VALUES (NEW.id, '', '', NULL, NULL);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
