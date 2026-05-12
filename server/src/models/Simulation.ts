/**
 * Simulation Model
 * MongoDB schema for infrastructure change simulations
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface ISimulation extends Document {
  officialId: mongoose.Types.ObjectId;
  changes: Array<{
    action: 'add' | 'remove' | 'modify';
    infrastructureType: string;
    location: {
      lat: number;
      lng: number;
    };
    metadata?: Record<string, any>;
  }>;
  predictedImpact: {
    darkSpotReduction: number;
    crimeZoneReduction: number;
    affectedRoutes: number;
  };
  createdAt: Date;
  expiresAt: Date;
}

const SimulationSchema = new Schema<ISimulation>({
  officialId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  changes: [{
    action: {
      type: String,
      enum: ['add', 'remove', 'modify'],
      required: true
    },
    infrastructureType: {
      type: String,
      required: true
    },
    location: {
      lat: {
        type: Number,
        required: true
      },
      lng: {
        type: Number,
        required: true
      }
    },
    metadata: Schema.Types.Mixed
  }],
  predictedImpact: {
    darkSpotReduction: Number,
    crimeZoneReduction: Number,
    affectedRoutes: Number
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true,
    expires: 0 // TTL index - auto-delete when expiresAt is reached
  }
});

// Indexes
SimulationSchema.index({ expiresAt: 1 });
SimulationSchema.index({ officialId: 1 });

export default mongoose.model<ISimulation>('Simulation', SimulationSchema);
