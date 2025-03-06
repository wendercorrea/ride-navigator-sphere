
interface MapStatusProps {
  trackingMode: boolean;
  showPassengerLocation: boolean;
  showDriverToDestinationRoute: boolean;
}

export const MapStatus = ({
  trackingMode,
  showPassengerLocation,
  showDriverToDestinationRoute
}: MapStatusProps) => {
  if (!trackingMode) return null;
  
  return (
    <div className="absolute bottom-4 left-4 flex items-center gap-2">
      <div className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded flex items-center">
        <div className="w-2 h-2 bg-blue-500 rounded-full mr-1 animate-pulse"></div>
        Motorista
      </div>
      {showPassengerLocation && (
        <div className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded flex items-center">
          <div className="w-2 h-2 bg-yellow-500 rounded-full mr-1"></div>
          Passageiro
        </div>
      )}
      {showDriverToDestinationRoute && (
        <div className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded flex items-center">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
          Rota Ativa
        </div>
      )}
    </div>
  );
};
