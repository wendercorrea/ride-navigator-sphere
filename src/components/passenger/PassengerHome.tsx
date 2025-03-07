
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MapPin, Search } from "lucide-react";
import { PendingRide } from "@/components/PendingRide";
import type { Ride } from "@/types/database";
import { FeatureGrid } from "./FeatureGrid";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { RideMap } from "@/components/RideMap";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  updatePickupWithCoords?: (address: string, lat: number, lng: number) => void;
  updateDestinationWithCoords?: (address: string, lat: number, lng: number) => void;
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
  updatePickupWithCoords,
  updateDestinationWithCoords,
}: PassengerHomeProps) {
  const [activeTab, setActiveTab] = useState("form");
  const [pickupCoords, setPickupCoords] = useState<{lat: number, lng: number} | null>(null);
  const [destinationCoords, setDestinationCoords] = useState<{lat: number, lng: number} | null>(null);
  const [selectingPickup, setSelectingPickup] = useState(true);
  const [mapKey, setMapKey] = useState(Date.now()); // Used to force map re-render

  // Handle location selection from map
  const handleLocationSelect = (lat: number, lng: number, address: string) => {
    if (selectingPickup) {
      setPickupCoords({ lat, lng });
      if (updatePickupWithCoords) {
        updatePickupWithCoords(address, lat, lng);
      } else {
        onPickupChange(address);
      }
    } else {
      setDestinationCoords({ lat, lng });
      if (updateDestinationWithCoords) {
        updateDestinationWithCoords(address, lat, lng);
      } else {
        onDestinationChange(address);
      }
    }
  };

  // Update map when switching between pickup and destination
  useEffect(() => {
    // Force map re-render when switching selection mode
    setMapKey(Date.now());
  }, [selectingPickup]);

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
        <h1 className="text-4xl font-bold tracking-tight">Uper</h1>
        <p className="text-lg text-muted-foreground max-w-[600px] mx-auto">
          Solicite seu transporte em segundos.
        </p>
      </div>

      {/* Ride Booking Card */}
      <Card className="w-full max-w-md p-6 animate-fade-up glass-effect">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="form">Endereço</TabsTrigger>
            <TabsTrigger value="map">Mapa</TabsTrigger>
          </TabsList>
          
          <TabsContent value="form" className="space-y-4">
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
          </TabsContent>
          
          <TabsContent value="map" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Button 
                variant={selectingPickup ? "default" : "outline"}
                onClick={() => setSelectingPickup(true)}
                className="flex-1"
              >
                <MapPin className="mr-2 h-4 w-4" />
                Origem
              </Button>
              <Button 
                variant={!selectingPickup ? "default" : "outline"}
                onClick={() => setSelectingPickup(false)}
                className="flex-1"
              >
                <MapPin className="mr-2 h-4 w-4" />
                Destino
              </Button>
            </div>
            <div className="h-[300px] rounded-lg overflow-hidden" key={mapKey}>
              <RideMap 
                selectionMode={true} 
                onLocationSelect={handleLocationSelect}
                initialLocation={selectingPickup ? pickupCoords : destinationCoords}
                locationSelectionType={selectingPickup ? "origin" : "destination"}
              />
            </div>
            <div className="text-sm text-muted-foreground">
              {selectingPickup ? (
                pickup ? `Origem: ${pickup}` : "Selecione o local de origem no mapa"
              ) : (
                destination ? `Destino: ${destination}` : "Selecione o destino no mapa"
              )}
            </div>
          </TabsContent>
          
          <Button 
            className="w-full mt-4" 
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
        </Tabs>
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
