/**
 * SystemConfig Model
 * MongoDB schema for system-wide configuration (singleton)
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface ISystemConfig extends Document {
  coordinateCenter: {
    lat: number;
    lng: number;
  };
  operationalRadius: number;
  severityWeights: {
    userInput: number;
    issueType: number;
    timeOfDay: number;
    crimeProximity: number;
  };
  routingWeights: {
    policeBoothRadius: number;
    streetlightRadius: number;
    darkSpotPenalty: number;
    crimeZonePenalty: number;
  };
  heatmapConfig: {
    darkSpotThreshold: number;
    crimeZoneThreshold: number;
    heatmapRadius: number;
  };
}

const SystemConfigSchema = new Schema<ISystemConfig>({
  coordinateCenter: {
    lat: {
      type: Number,
      required: true
    },
    lng: {
      type: Number,
      required: true
    }
  },
  operationalRadius: {
    type: Number,
    default: 5000
  },
  severityWeights: {
    userInput: {
      type: Number,
      default: 0.4
    },
    issueType: {
      type: Number,
      default: 0.3
    },
    timeOfDay: {
      type: Number,
      default: 0.2
    },
    crimeProximity: {
      type: Number,
      default: 0.1
    }
  },
  routingWeights: {
    policeBoothRadius: {
      type: Number,
      default: 100
    },
    streetlightRadius: {
      type: Number,
      default: 50
    },
    darkSpotPenalty: {
      type: Number,
      default: 2.0
    },
    crimeZonePenalty: {
      type: Number,
      default: 3.0
    }
  },
  heatmapConfig: {
    darkSpotThreshold: {
      type: Number,
      default: 50
    },
    crimeZoneThreshold: {
      type: Number,
      default: 10
    },
    heatmapRadius: {
      type: Number,
      default: 200
    }
  }
});

export default mongoose.model<ISystemConfig>('SystemConfig', SystemConfigSchema);
