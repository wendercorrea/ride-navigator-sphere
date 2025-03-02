
import React from "react";
import { CardContent } from "@/components/ui/card";
import { Database } from "@/integrations/supabase/types";
import { StatusBadge } from "@/components/ride/StatusBadge";

type RideStatus = Database["public"]["Enums"]["ride_status"];

interface RideFiltersProps {
  currentFilter: RideStatus | null;
  onFilterChange: (filter: RideStatus | null) => void;
}

export const RideFilters = ({ currentFilter, onFilterChange }: RideFiltersProps) => {
  const statuses: RideStatus[] = ['completed', 'cancelled', 'pending', 'accepted', 'in_progress'];

  return (
    <CardContent>
      <div className="flex flex-wrap gap-2 mb-4">
        <button 
          onClick={() => onFilterChange(null)} 
          className={`px-3 py-1 rounded-full text-sm ${!currentFilter ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}
        >
          Todas
        </button>
        {statuses.map(status => (
          <button 
            key={status} 
            onClick={() => onFilterChange(status)}
            className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${currentFilter === status ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}
          >
            <StatusBadge status={status} />
          </button>
        ))}
      </div>
    </CardContent>
  );
};
