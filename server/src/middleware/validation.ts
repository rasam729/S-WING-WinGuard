/**
 * Validation Middleware
 * Request validation and geographic boundary checking
 */

import { Request, Response, NextFunction } from 'express';
import { isWithinOperationalRadius, isValidCoordinate } from '@shared/safetyLogic';
import { HTTP_STATUS, ERROR_CODES, VALIDATION } from '@shared/constants';
import SystemConfig from '../models/SystemConfig';

/**
 * Validate geographic coordinates are within operational radius
 */
export async function validateBoundary(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { latitude, longitude } = req.body;

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: 'Invalid coordinates',
        code: ERROR_CODES.VALIDATION_ERROR,
        fields: {
          latitude: 'Must be a number',
          longitude: 'Must be a number'
        }
      });
      return;
    }

    const point = { lat: latitude, lng: longitude };

    if (!isValidCoordinate(point)) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: 'Invalid coordinates',
        code: ERROR_CODES.VALIDATION_ERROR,
        fields: {
          latitude: `Must be between ${VALIDATION.LATITUDE_MIN} and ${VALIDATION.LATITUDE_MAX}`,
          longitude: `Must be between ${VALIDATION.LONGITUDE_MIN} and ${VALIDATION.LONGITUDE_MAX}`
        }
      });
      return;
    }

    // Get system configuration
    const config = await SystemConfig.findOne();
    if (!config) {
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: 'System configuration not found',
        code: ERROR_CODES.INTERNAL_ERROR
      });
      return;
    }

    const center = {
      lat: config.coordinateCenter.lat,
      lng: config.coordinateCenter.lng
    };

    if (!isWithinOperationalRadius(point, center, config.operationalRadius)) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: 'Location outside operational radius',
        code: ERROR_CODES.OUTSIDE_RADIUS,
        center: center,
        radius: config.operationalRadius
      });
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Validate report creation request
 */
export function validateReportRequest(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const { issueType, description, userSeverity, latitude, longitude } = req.body;
  const errors: Record<string, string> = {};

  if (!issueType || !['pothole', 'streetlight', 'crime', 'other'].includes(issueType)) {
    errors.issueType = 'Must be one of: pothole, streetlight, crime, other';
  }

  if (!description || typeof description !== 'string') {
    errors.description = 'Description is required';
  } else if (description.length > VALIDATION.DESCRIPTION_MAX_LENGTH) {
    errors.description = `Description must be less than ${VALIDATION.DESCRIPTION_MAX_LENGTH} characters`;
  }

  if (typeof userSeverity !== 'number' || 
      userSeverity < VALIDATION.USER_SEVERITY_MIN || 
      userSeverity > VALIDATION.USER_SEVERITY_MAX) {
    errors.userSeverity = `Must be between ${VALIDATION.USER_SEVERITY_MIN} and ${VALIDATION.USER_SEVERITY_MAX}`;
  }

  if (typeof latitude !== 'number') {
    errors.latitude = 'Latitude is required and must be a number';
  }

  if (typeof longitude !== 'number') {
    errors.longitude = 'Longitude is required and must be a number';
  }

  if (!req.file) {
    errors.photo = 'Photo is required';
  }

  if (Object.keys(errors).length > 0) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: 'Validation failed',
      code: ERROR_CODES.VALIDATION_ERROR,
      fields: errors
    });
    return;
  }

  next();
}

/**
 * Validate route calculation request
 */
export function validateRouteRequest(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const { origin, destination, routeType } = req.body;
  const errors: Record<string, string> = {};

  if (!origin || typeof origin.lat !== 'number' || typeof origin.lng !== 'number') {
    errors.origin = 'Origin must have valid lat and lng coordinates';
  }

  if (!destination || typeof destination.lat !== 'number' || typeof destination.lng !== 'number') {
    errors.destination = 'Destination must have valid lat and lng coordinates';
  }

  if (!routeType || !['safe', 'fast'].includes(routeType)) {
    errors.routeType = 'Route type must be either "safe" or "fast"';
  }

  if (Object.keys(errors).length > 0) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: 'Validation failed',
      code: ERROR_CODES.VALIDATION_ERROR,
      fields: errors
    });
    return;
  }

  next();
}

/**
 * Validate pagination parameters
 */
export function validatePagination(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const limit = parseInt(req.query.limit as string) || 50;
  const offset = parseInt(req.query.offset as string) || 0;

  if (limit < 1 || limit > 100) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: 'Validation failed',
      code: ERROR_CODES.VALIDATION_ERROR,
      fields: {
        limit: 'Must be between 1 and 100'
      }
    });
    return;
  }

  if (offset < 0) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: 'Validation failed',
      code: ERROR_CODES.VALIDATION_ERROR,
      fields: {
        offset: 'Must be 0 or greater'
      }
    });
    return;
  }

  // Attach validated values to request
  req.query.limit = limit.toString();
  req.query.offset = offset.toString();

  next();
}
