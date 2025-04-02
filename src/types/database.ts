
import { Database } from "@/integrations/supabase/types";

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Driver = Database['public']['Tables']['drivers']['Row'];
export type Ride = Database['public']['Tables']['rides']['Row'];
export type Rating = Database['public']['Tables']['ratings']['Row'];
export type RideLog = Database['public']['Tables']['ride_logs']['Row'];
export type RideStatus = Database['public']['Enums']['ride_status'];
