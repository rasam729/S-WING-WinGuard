import { create } from 'zustand';
import type { SimulationChange, PredictedImpact, HeatmapPoint } from '@shared/types';

interface SimulationState {
  simulationId: string | null;
  changes: SimulationChange[];
  predictedImpact: PredictedImpact | null;
  updatedHeatmaps: {
    darkSpots: HeatmapPoint[];
    crimeZones: HeatmapPoint[];
  } | null;
  isSimulating: boolean;
  addChange: (change: SimulationChange) => void;
  removeChange: (index: number) => void;
  clearChanges: () => void;
  setSimulationResult: (result: {
    simulationId: string;
    predictedImpact: PredictedImpact;
    updatedHeatmaps: {
      darkSpots: HeatmapPoint[];
      crimeZones: HeatmapPoint[];
    };
  }) => void;
  setIsSimulating: (isSimulating: boolean) => void;
  reset: () => void;
}

export const useSimulationStore = create<SimulationState>((set) => ({
  simulationId: null,
  changes: [],
  predictedImpact: null,
  updatedHeatmaps: null,
  isSimulating: false,
  
  addChange: (change) => set((state) => ({
    changes: [...state.changes, change]
  })),
  
  removeChange: (index) => set((state) => ({
    changes: state.changes.filter((_, i) => i !== index)
  })),
  
  clearChanges: () => set({
    changes: [],
    simulationId: null,
    predictedImpact: null,
    updatedHeatmaps: null
  }),
  
  setSimulationResult: (result) => set({
    simulationId: result.simulationId,
    predictedImpact: result.predictedImpact,
    updatedHeatmaps: result.updatedHeatmaps
  }),
  
  setIsSimulating: (isSimulating) => set({ isSimulating }),
  
  reset: () => set({
    simulationId: null,
    changes: [],
    predictedImpact: null,
    updatedHeatmaps: null,
    isSimulating: false
  }),
}));
