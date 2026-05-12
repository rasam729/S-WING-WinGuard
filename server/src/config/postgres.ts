/**
 * PostgreSQL Database Configuration with PostGIS Support
 * Supports both local and cloud PostgreSQL (Neon, Supabase, Railway, Render)
 */

import { Pool, PoolClient, PoolConfig } from 'pg';

// Build pool configuration
// Supports both DATABASE_URL (cloud) and individual parameters (local)
const poolConfig: PoolConfig = process.env.DATABASE_URL
  ? {
      // Cloud PostgreSQL (Neon, Supabase, Railway, Render)
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false, // Required for most cloud providers
      },
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000, // Increased for cloud connections
    }
  : {
      // Local PostgreSQL
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'roadwatch123',
      database: process.env.DB_NAME || 'inventory_db',
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    };

const pool = new Pool(poolConfig);

// Connection event handlers
pool.on('connect', (client) => {
  console.log('✓ PostgreSQL client connected');
  
  // Set timezone for all connections
  client.query('SET timezone = "UTC"').catch((err) => {
    console.error('Error setting timezone:', err);
  });
});

pool.on('error', (err) => {
  console.error('❌ Unexpected PostgreSQL pool error:', err);
  // Don't exit process - let the app handle reconnection
});

pool.on('remove', () => {
  console.log('PostgreSQL client removed from pool');
});

/**
 * Connect to PostgreSQL and verify PostGIS extension
 */
export async function connectPostgres(): Promise<void> {
  let client: PoolClient | null = null;
  
  try {
    console.log('🔌 Connecting to PostgreSQL...');
    console.log('📍 Connection type:', process.env.DATABASE_URL ? 'Cloud (DATABASE_URL)' : 'Local (individual params)');
    
    // Test connection
    client = await pool.connect();
    console.log('✓ PostgreSQL connected successfully');
    
    // Verify PostGIS extension
    try {
      const result = await client.query('SELECT PostGIS_Version()');
      console.log('✓ PostGIS version:', result.rows[0].postgis_version);
    } catch (error) {
      console.warn('⚠️  PostGIS extension not found. Installing...');
      try {
        await client.query('CREATE EXTENSION IF NOT EXISTS postgis');
        const result = await client.query('SELECT PostGIS_Version()');
        console.log('✓ PostGIS installed, version:', result.rows[0].postgis_version);
      } catch (installError) {
        console.error('❌ Failed to install PostGIS. Please enable it manually in your database.');
        throw installError;
      }
    }
    
    // Verify required tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('reports', 'budgets', 'departments')
    `);
    
    const existingTables = tablesResult.rows.map(row => row.table_name);
    console.log('✓ Found tables:', existingTables.join(', '));
    
    if (existingTables.length === 0) {
      console.warn('⚠️  No tables found. Please import roadwatch_v1.sql schema.');
    }
    
    console.log('✓ Database ready');
    console.log('✓ Environment:', process.env.NODE_ENV || 'development');
    
  } catch (error: any) {
    console.error('❌ Failed to connect to PostgreSQL');
    
    // Provide helpful error messages
    if (error.code === 'ECONNREFUSED') {
      console.error('Connection refused. Please check:');
      console.error('  1. PostgreSQL is running');
      console.error('  2. Host and port are correct');
      console.error('  3. Firewall allows connections');
    } else if (error.code === 'ENOTFOUND') {
      console.error('Host not found. Please check DB_HOST or DATABASE_URL');
    } else if (error.message?.includes('password authentication failed')) {
      console.error('Authentication failed. Please check DB_USER and DB_PASSWORD');
    } else if (error.message?.includes('database') && error.message?.includes('does not exist')) {
      console.error('Database does not exist. Please create it first.');
    } else {
      console.error('Error details:', error.message);
    }
    
    throw error;
  } finally {
    if (client) {
      client.release();
    }
  }
}

/**
 * Execute a query with automatic error handling and logging
 */
export async function query(text: string, params?: any[]): Promise<any> {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    
    // Log slow queries (> 1 second)
    if (duration > 1000) {
      console.warn(`⚠️  Slow query (${duration}ms):`, text.substring(0, 100));
    }
    
    return res;
  } catch (error: any) {
    console.error('❌ Query error:', error.message);
    console.error('Query:', text);
    console.error('Params:', params);
    throw error;
  }
}

/**
 * Get a client from the pool for transactions
 */
export async function getClient(): Promise<PoolClient> {
  return await pool.connect();
}

/**
 * Execute a transaction with automatic rollback on error
 */
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Close all connections (for graceful shutdown)
 */
export async function closePool(): Promise<void> {
  await pool.end();
  console.log('✓ PostgreSQL pool closed');
}

// Named export for compatibility
export { pool };

export default pool;
