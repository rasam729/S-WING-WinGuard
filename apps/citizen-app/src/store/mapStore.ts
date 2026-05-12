import { create } from 'zustand';
import type { LatLng } from '@shared/types';

interface MapState {
  center: LatLng;
  zoom: number;
  selectedLocation: LatLng | null;
  userLocation: LatLng | null;
  setCenter: (center: LatLng) => void;
  setZoom: (zoom: number) => void;
  setSelectedLocation: (location: LatLng | null) => void;
  setUserLocation: (location: LatLng | null) => void;
}

export const useMapStore = create<MapState>((set) => ({
  center: { lat: 40.7128, lng: -74.006 }, // Default to NYC
  zoom: 13,
  selectedLocation: null,
  userLocation: null,
  setCenter: (center) => set({ center }),
  setZoom: (zoom) => set({ zoom }),
  setSelectedLocation: (location) => set({ selectedLocation: location }),
  setUserLocation: (location) => set({ userLocation: location }),
}));
