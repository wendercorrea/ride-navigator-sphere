
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Log to help with debugging
    console.log("🔑 Retrieving Google Maps API key from environment");
    
    const GOOGLE_MAPS_API_KEY = Deno.env.get("GOOGLE_MAPS_API_KEY");
    
    if (!GOOGLE_MAPS_API_KEY) {
      console.error("❌ Google Maps API key not found in environment variables");
      throw new Error("Google Maps API key not configured. Please set the GOOGLE_MAPS_API_KEY environment variable.");
    }
    
    console.log("✅ Google Maps API key retrieved successfully");

    return new Response(
      JSON.stringify({ 
        GOOGLE_MAPS_API_KEY,
        // Add placemark flag to indicate required APIs
        requiredApis: [
          "Maps JavaScript API",
          "Places API",
          "Geocoding API",
          "Directions API"
        ],
        apiStatus: "Check that all required APIs are enabled in the Google Cloud Console"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("❌ Error retrieving Google Maps API key:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to retrieve Google Maps API key",
        hint: "Make sure the GOOGLE_MAPS_API_KEY is set in your Supabase project settings and has all required APIs enabled: Maps JavaScript API, Places API, Geocoding API, and Directions API." 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      },
    );
  }
});
