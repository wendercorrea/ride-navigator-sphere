
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MapPin, Search } from "lucide-react";
import { PendingRide } from "@/components/PendingRide";
import type { Ride } from "@/types/database";
import { FeatureGrid } from "./FeatureGrid";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface PassengerHomeProps {
  pickup: string;
  destination: string;
  loading: boolean;
  pendingRide: Ride | null;
  showCancelDialog: boolean;
  onPickupChange: (value: string) => void;
  onDestinationChange: (value: string) => void;
  onRequestRide: () => void;
  onCancelRide: () => void;
  setShowCancelDialog: (show: boolean) => void;
}

export function PassengerHome({ 
  pickup, 
  destination, 
  loading, 
  pendingRide,
  showCancelDialog,
  onPickupChange,
  onDestinationChange,
  onRequestRide,
  onCancelRide,
  setShowCancelDialog,
}: PassengerHomeProps) {
  if (pendingRide) {
    return (
      <PendingRide 
        ride={pendingRide} 
        onCancel={onCancelRide}
        onConclude={() => {}} // Adicionado para satisfazer o tipo
        loading={loading}
      />
    );
  }

  return (
    <>
      {/* Hero Section */}
      <div className="text-center space-y-4 animate-fade-down">
        <div className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
          Corridas Seguras e Confiáveis
        </div>
        <p className="text-lg text-muted-foreground max-w-[600px] mx-auto">
          Solicite seu transporte em segundos.
        </p>
      </div>

      {/* Ride Booking Card */}
      <Card className="w-full max-w-md p-6 animate-fade-up glass-effect">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Local de partida"
                className="pl-10"
                value={pickup}
                onChange={(e) => onPickupChange(e.target.value)}
              />
            </div>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Para onde?"
                className="pl-10"
                value={destination}
                onChange={(e) => onDestinationChange(e.target.value)}
              />
            </div>
          </div>
          <Button 
            className="w-full" 
            size="lg" 
            onClick={onRequestRide}
            disabled={loading || !pickup || !destination}
          >
            {loading ? (
              "Solicitando..."
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Solicitar Corrida
              </>
            )}
          </Button>
        </div>
      </Card>

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar corrida atual?</AlertDialogTitle>
            <AlertDialogDescription>
              Você já tem uma corrida pendente. Deseja cancelá-la e solicitar uma nova corrida?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Não, manter corrida atual</AlertDialogCancel>
            <AlertDialogAction onClick={onCancelRide}>
              Sim, cancelar e solicitar nova
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <FeatureGrid />
    </>
  );
}
