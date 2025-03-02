
import React from "react";
import { BadgeCheck, Car, Clock, MapPin, User } from "lucide-react";
import { Database } from "@/integrations/supabase/types";

type RideStatus = Database["public"]["Enums"]["ride_status"];

interface StatusBadgeProps {
  status: RideStatus;
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: "Pendente",
      accepted: "Aceita",
      in_progress: "Em Andamento",
      completed: "Concluída",
      cancelled: "Cancelada"
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      pending: "text-yellow-500 bg-yellow-50",
      accepted: "text-blue-500 bg-blue-50",
      in_progress: "text-purple-500 bg-purple-50",
      completed: "text-green-500 bg-green-50",
      cancelled: "text-red-500 bg-red-50"
    };
    return colorMap[status] || "text-gray-500 bg-gray-50";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <BadgeCheck className="h-4 w-4" />;
      case 'in_progress':
        return <Car className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'accepted':
        return <User className="h-4 w-4" />;
      case 'cancelled':
        return <MapPin className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <span className={`px-2 py-0.5 text-xs rounded-full inline-flex items-center gap-1 ${getStatusColor(status)}`}>
      {getStatusIcon(status)}
      {getStatusText(status)}
    </span>
  );
};
