/**
 * SafetyIssue Model
 * MongoDB schema for citizen-reported safety issues
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface ISafetyIssue extends Document {
  issueType: 'pothole' | 'streetlight' | 'crime' | 'other';
  description: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  photoUrl: string;
  photoMetadata: {
    capturedAt: Date;
    exifLocation: {
      lat: number;
      lng: number;
    } | null;
  };
  severity: {
    userInput: number;
    calculated: number;
    factors: {
      issueTypeWeight: number;
      timeOfDayWeight: number;
      proximityToCrimeWeight: number;
    };
  };
  status: 'reported' | 'resolved';
  reportedBy: mongoose.Types.ObjectId;
  reportedAt: Date;
  resolvedBy: mongoose.Types.ObjectId | null;
  resolvedAt: Date | null;
}

const SafetyIssueSchema = new Schema<ISafetyIssue>({
  issueType: {
    type: String,
    enum: ['pothole', 'streetlight', 'crime', 'other'],
    required: true
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000
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
  photoUrl: {
    type: String,
    required: true
  },
  photoMetadata: {
    capturedAt: {
      type: Date,
      required: true
    },
    exifLocation: {
      lat: Number,
      lng: Number
    }
  },
  severity: {
    userInput: {
      type: Number,
      min: 1,
      max: 10,
      required: true
    },
    calculated: {
      type: Number,
      min: 0,
      max: 100,
      required: true
    },
    factors: {
      issueTypeWeight: Number,
      timeOfDayWeight: Number,
      proximityToCrimeWeight: Number
    }
  },
  status: {
    type: String,
    enum: ['reported', 'resolved'],
    default: 'reported'
  },
  reportedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reportedAt: {
    type: Date,
    default: Date.now
  },
  resolvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  resolvedAt: {
    type: Date,
    default: null
  }
});

// Indexes
SafetyIssueSchema.index({ location: '2dsphere' });
SafetyIssueSchema.index({ status: 1 });
SafetyIssueSchema.index({ 'severity.calculated': -1 });
SafetyIssueSchema.index({ reportedAt: -1 });
SafetyIssueSchema.index({ issueType: 1 });

export default mongoose.model<ISafetyIssue>('SafetyIssue', SafetyIssueSchema);
