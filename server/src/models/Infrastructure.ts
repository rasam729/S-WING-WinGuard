/**
 * Infrastructure Model
 * MongoDB schema for city infrastructure (police booths, streetlights, etc.)
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IInfrastructure extends Document {
  type: 'police_booth' | 'streetlight' | 'hospital' | 'pothole';
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  status: 'functional' | 'broken' | 'simulated';
  metadata: {
    name?: string;
    brightness?: number;
    lastMaintenance?: Date;
  };
  createdAt: Date;
  createdBy: mongoose.Types.ObjectId | null;
}

const InfrastructureSchema = new Schema<IInfrastructure>({
  type: {
    type: String,
    enum: ['police_booth', 'streetlight', 'hospital', 'pothole'],
    required: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  status: {
    type: String,
    enum: ['functional', 'broken', 'simulated'],
    default: 'functional'
  },
  metadata: {
    name: String,
    brightness: Number,
    lastMaintenance: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
});

// Indexes
InfrastructureSchema.index({ location: '2dsphere' });
InfrastructureSchema.index({ type: 1 });
InfrastructureSchema.index({ status: 1 });

export default mongoose.model<IInfrastructure>('Infrastructure', InfrastructureSchema);
