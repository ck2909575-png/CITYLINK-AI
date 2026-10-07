import { useState, useEffect, useCallback } from 'react';

export interface GeoLocationState {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  isLoading: boolean;
  error: string | null;
  isCustom: boolean;
}

const DEFAULT_COORDINATES = {
  latitude: 37.7749,
  longitude: -122.4194,
};

export function useGeolocation() {
  const [state, setState] = useState<GeoLocationState>({
    latitude: DEFAULT_COORDINATES.latitude,
    longitude: DEFAULT_COORDINATES.longitude,
    accuracy: null,
    isLoading: true,
    error: null,
    isCustom: false,
  });

  const getCoordinates = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: 'Geolocation is not supported by your browser. Using municipal center coordinates.',
      }));
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          isLoading: false,
          error: null,
          isCustom: false,
        });
      },
      (error) => {
        let msg = 'Could not acquire precise GPS.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Location permission denied. Using metropolitan default coordinates.';
        }
        setState({
          latitude: DEFAULT_COORDINATES.latitude,
          longitude: DEFAULT_COORDINATES.longitude,
          accuracy: null,
          isLoading: false,
          error: msg,
          isCustom: false,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );
  }, []);

  useEffect(() => {
    getCoordinates();
  }, [getCoordinates]);

  const setManualCoordinates = (lat: number, lng: number) => {
    setState({
      latitude: lat,
      longitude: lng,
      accuracy: 5,
      isLoading: false,
      error: null,
      isCustom: true,
    });
  };

  return {
    ...state,
    refreshCoordinates: getCoordinates,
    setManualCoordinates,
  };
}
