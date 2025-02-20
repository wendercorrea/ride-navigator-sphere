import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const { method, pickup_lat, pickup_lon } = await req.json()

    switch (method) {
      case 'findNearbyDrivers': {
        const { data, error } = await supabaseClient.rpc('find_nearby_drivers', {
          pickup_lat,
          pickup_lon,
          max_distance: 5,
        })

        if (error) throw error

        return new Response(
          JSON.stringify({ drivers: data }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        )
      }

      case 'estimatePrice': {
        // Implementar lógica de estimativa de preço
        const basePrice = 5.0
        const pricePerKm = 2.0
        const distance = data.distance // Distância calculada pela função find_nearby_drivers
        const estimatedPrice = basePrice + (distance * pricePerKm)

        return new Response(
          JSON.stringify({ estimated_price: estimatedPrice }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        )
      }

      default:
        throw new Error('Method not supported')
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
