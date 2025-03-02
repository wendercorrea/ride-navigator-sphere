
import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

interface StatusToggleProps {
  isOnline: boolean;
  setIsOnline: (online: boolean) => void;
  userId: string | undefined;
}

export function StatusToggle({ isOnline, setIsOnline, userId }: StatusToggleProps) {
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const updateDriverStatus = async (online: boolean) => {
    if (!userId) return;

    setIsUpdatingStatus(true);
    try {
      const { error } = await supabase
        .from('drivers')
        .update({ status: online ? 'online' : 'offline' })
        .eq('id', userId);

      if (error) throw error;

      setIsOnline(online);
      toast({
        title: "Status Atualizado",
        description: `Você está ${online ? 'online' : 'offline'}`,
      });
    } catch (error) {
      console.error('Error updating driver status:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status",
        variant: "destructive",
      });
      setIsOnline(!online);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Label htmlFor="driver-status" className="text-base">Status do Motorista</Label>
          <p className="text-sm text-muted-foreground">
            {isOnline ? "Você está disponível para corridas" : "Você está offline"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isUpdatingStatus && <Loader2 className="h-4 w-4 animate-spin" />}
          <Switch
            id="driver-status"
            checked={isOnline}
            onCheckedChange={updateDriverStatus}
            disabled={isUpdatingStatus}
          />
        </div>
      </div>
    </Card>
  );
}
