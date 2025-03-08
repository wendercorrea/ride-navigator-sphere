
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface PassengerInfoProviderProps {
  passengerId: string | null;
  children: (passengerInfo: {
    first_name: string;
    last_name: string;
    phone: string | null;
  } | null) => React.ReactNode;
}

export function PassengerInfoProvider({ passengerId, children }: PassengerInfoProviderProps) {
  const [passengerInfo, setPassengerInfo] = useState<{
    first_name: string;
    last_name: string;
    phone: string | null;
  } | null>(null);

  useEffect(() => {
    const fetchPassengerInfo = async () => {
      if (!passengerId) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('first_name, last_name, phone')
          .eq('id', passengerId)
          .single();
          
        if (error) throw error;
        setPassengerInfo(data);
      } catch (error) {
        console.error('Error fetching passenger info:', error);
      }
    };
    
    fetchPassengerInfo();
  }, [passengerId]);

  return <>{children(passengerInfo)}</>;
}
