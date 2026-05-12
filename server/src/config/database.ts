/**
 * Database Configuration
 * MongoDB connection and initialization
 */

import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/winguard';

console.log('🔍 Environment check:');
console.log('  NODE_ENV:', process.env.NODE_ENV);
console.log('  MONGODB_URI:', MONGODB_URI);
console.log('  Using Atlas:', MONGODB_URI.includes('mongodb+srv'));

export async function connectDatabase(): Promise<void> {
  try {
    // Add connection options for better compatibility
    // Use directConnection for DNS issues
    const options = {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4, // Use IPv4
    };
    
    console.log('🔌 Attempting to connect to MongoDB...');
    await mongoose.connect(MONGODB_URI, options);
    console.log('✅ MongoDB connected successfully');

    // Initialize with mock data if database is empty
    await initializeMockData();
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

async function initializeMockData(): Promise<void> {
  try {
    // Check if database already has data
    const db = mongoose.connection.db;
    if (!db) {
      console.log('Database connection not ready');
      return;
    }

    const collections = await db.listCollections().toArray();
    const hasData = collections.some(col => 
      ['users', 'safetyissues', 'infrastructures'].includes(col.name)
    );

    if (hasData) {
      const userCount = await db.collection('users').countDocuments();
      if (userCount > 0) {
        console.log('Database already initialized with data');
        return;
      }
    }

    // Load mock data
    const mockDataPath = path.join(__dirname, '../../../shared/mockData.json');
    if (!fs.existsSync(mockDataPath)) {
      console.log('Mock data file not found, skipping initialization');
      return;
    }

    const mockData = JSON.parse(fs.readFileSync(mockDataPath, 'utf-8'));
    console.log('Loading mock data...');

    // Import models
    const User = (await import('../models/User')).default;
    const SafetyIssue = (await import('../models/SafetyIssue')).default;
    const Infrastructure = (await import('../models/Infrastructure')).default;
    const SystemConfig = (await import('../models/SystemConfig')).default;

    // Create users
    if (mockData.users && mockData.users.length > 0) {
      const bcrypt = await import('bcrypt');
      const usersToCreate = await Promise.all(
        mockData.users.map(async (user: any) => ({
          username: user.username,
          passwordHash: await bcrypt.hash(
            user.username.includes('citizen') ? 'citizen123' : 'official123',
            10
          ),
          role: user.role,
          createdAt: new Date(),
          lastLogin: new Date()
        }))
      );
      await User.insertMany(usersToCreate);
      console.log(`✓ Created ${usersToCreate.length} users`);
    }

    // Create infrastructure
    if (mockData.infrastructure && mockData.infrastructure.length > 0) {
      const infrastructureToCreate = mockData.infrastructure.map((item: any) => ({
        type: item.type,
        location: {
          type: 'Point',
          coordinates: [item.location.lng, item.location.lat]
        },
        status: item.status,
        metadata: item.metadata || {},
        createdAt: new Date(),
        createdBy: null
      }));
      await Infrastructure.insertMany(infrastructureToCreate);
      console.log(`✓ Created ${infrastructureToCreate.length} infrastructure items`);
    }

    // Create safety issues
    if (mockData.safetyIssues && mockData.safetyIssues.length > 0) {
      const citizenUser = await User.findOne({ role: 'citizen' });
      const officialUser = await User.findOne({ role: 'official' });

      const issuesToCreate = mockData.safetyIssues.map((issue: any) => ({
        issueType: issue.issueType,
        description: issue.description,
        location: {
          type: 'Point',
          coordinates: [issue.location.lng, issue.location.lat]
        },
        photoUrl: '/uploads/placeholder.jpg',
        photoMetadata: {
          capturedAt: new Date(issue.reportedAt),
          exifLocation: null
        },
        severity: {
          userInput: issue.severity.userInput,
          calculated: issue.severity.calculated,
          factors: {
            issueTypeWeight: 0.3,
            timeOfDayWeight: 0.2,
            proximityToCrimeWeight: 0.1
          }
        },
        status: issue.status,
        reportedBy: citizenUser?._id,
        reportedAt: new Date(issue.reportedAt),
        resolvedBy: issue.status === 'resolved' ? officialUser?._id : null,
        resolvedAt: issue.resolvedAt ? new Date(issue.resolvedAt) : null
      }));
      await SafetyIssue.insertMany(issuesToCreate);
      console.log(`✓ Created ${issuesToCreate.length} safety issues`);
    }

    // Create system configuration
    const configExists = await SystemConfig.findOne();
    if (!configExists) {
      await SystemConfig.create({
        coordinateCenter: mockData.coordinateCenter || {
          lat: 40.7128,
          lng: -74.006
        },
        operationalRadius: mockData.operationalRadius || 5000,
        severityWeights: {
          userInput: 0.4,
          issueType: 0.3,
          timeOfDay: 0.2,
          crimeProximity: 0.1
        },
        routingWeights: {
          policeBoothRadius: 100,
          streetlightRadius: 50,
          darkSpotPenalty: 2.0,
          crimeZonePenalty: 3.0
        },
        heatmapConfig: {
          darkSpotThreshold: 50,
          crimeZoneThreshold: 10,
          heatmapRadius: 200
        }
      });
      console.log('✓ Created system configuration');
    }

    console.log('Mock data initialization complete');
  } catch (error) {
    console.error('Error initializing mock data:', error);
    // Don't throw - allow server to start even if mock data fails
  }
}

export default connectDatabase;
