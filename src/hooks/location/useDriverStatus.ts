
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useDriverStatus() {
  const { user } = useAuth();
  const [isDriver, setIsDriver] = useState<boolean | null>(null);

  useEffect(() => {
    const checkIfDriver = async () => {
      if (!user?.id) return;
      
      try {
        const { data, error } = await supabase
          .from("drivers")
          .select("id")
          .eq("id", user.id)
          .maybeSingle();

        if (error) throw error;
        setIsDriver(!!data);
      } catch (error) {
        console.error("Error checking driver status:", error);
        setIsDriver(false);
      }
    };

    checkIfDriver();
  }, [user?.id]);

  return { isDriver };
}
