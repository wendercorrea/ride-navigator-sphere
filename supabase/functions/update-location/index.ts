
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple in-memory cache to rate limit updates
const updateCache = new Map();

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  
  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );
    
    const { userId, latitude, longitude, rideId, userType } = await req.json();
    
    if (!userId || latitude === undefined || longitude === undefined) {
      throw new Error("Missing required fields: userId, latitude, longitude");
    }
    
    const cacheKey = `${rideId}-${userType}-${userId}`;
    const now = Date.now();
    const lastUpdate = updateCache.get(cacheKey) || 0;
    
    // Only allow updates every 2 seconds to reduce DB writes
    if (now - lastUpdate < 2000) {
      return new Response(
        JSON.stringify({ success: true, throttled: true }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }
    
    updateCache.set(cacheKey, now);
    
    console.log(`Updating location for ${userType} ${userId}: lat ${latitude}, lng ${longitude}`);
    
    if (userType === 'driver') {
      // Update driver's current location
      const { error: driverError } = await supabaseClient
        .from('drivers')
        .update({
          current_latitude: latitude,
          current_longitude: longitude,
        })
        .eq('id', userId);
      
      if (driverError) throw driverError;
      
      // If there's an active ride, update it with the driver's location
      if (rideId) {
        const { error: broadcastError } = await supabaseClient
          .from('ride_location_updates')
          .upsert({
            ride_id: rideId,
            driver_latitude: latitude,
            driver_longitude: longitude,
            updated_at: new Date().toISOString(),
          });
        
        if (broadcastError) throw broadcastError;
      }
    } else if (userType === 'passenger' && rideId) {
      // For passengers, we only update the ride_location_updates table
      const { error: broadcastError } = await supabaseClient
        .from('ride_location_updates')
        .upsert({
          ride_id: rideId,
          passenger_latitude: latitude,
          passenger_longitude: longitude,
          updated_at: new Date().toISOString(),
        });
      
      if (broadcastError) throw broadcastError;
    }
    
    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("Error updating location:", error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      },
    );
  }
});
