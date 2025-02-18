
import { useRideRequest } from './ride/useRideRequest';
import { useRideDriver } from './ride/useRideDriver';
import { useRideActions } from './ride/useRideActions';

export function useRide() {
  const { requestRide, loading: requestLoading } = useRideRequest();
  const { acceptRide, startRide, completeRide, loading: driverLoading } = useRideDriver();
  const { cancelRide, rateRide, loading: actionsLoading } = useRideActions();

  const loading = requestLoading || driverLoading || actionsLoading;

  return {
    // Passenger actions
    requestRide,
    // Driver actions
    acceptRide,
    startRide,
    completeRide,
    // Common actions
    cancelRide,
    rateRide,
    // Loading state
    loading,
  };
}
