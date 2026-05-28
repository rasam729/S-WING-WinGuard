/**
 * Run Database Schema Updates
 * Executes the schema-updates.sql file against the PostgreSQL database
 */

import { pool } from '../config/postgres';
import * as fs from 'fs';
import * as path from 'path';

async function runSchemaUpdates() {
  try {
    console.log('🔄 Starting database schema updates...');
    
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, '../../database/schema-updates.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('📝 Executing SQL file...');
    
    try {
      // Execute the entire SQL file as one transaction
      await pool.query(sql);
      console.log('\n✅ Database schema updated successfully!');
    } catch (error: any) {
      // If batch execution fails, try statement by statement
      console.log('⚠️  Batch execution failed, trying statement by statement...');
      
      // Split by semicolons and execute each statement
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--') && s !== '');
      
      console.log(`📝 Found ${statements.length} SQL statements to execute`);
      
      let successCount = 0;
      let errorCount = 0;
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i] + ';';
        
        // Skip comments and empty lines
        if (statement.trim().startsWith('--') || statement.trim() === ';') continue;
        
        try {
          await pool.query(statement);
          successCount++;
          
          // Log progress every 10 statements
          if ((i + 1) % 10 === 0) {
            console.log(`✓ Executed ${i + 1}/${statements.length} statements`);
          }
        } catch (error: any) {
          // Ignore "already exists" errors
          if (error.message.includes('already exists') || 
              error.message.includes('duplicate key') ||
              error.message.includes('duplicate column')) {
            console.log(`⚠️  Skipped (already exists): ${statement.substring(0, 50)}...`);
            successCount++;
          } else {
            console.error(`❌ Error executing statement: ${statement.substring(0, 100)}...`);
            console.error(`   Error: ${error.message}`);
            errorCount++;
          }
        }
      }
      
      console.log('\n📊 Schema Update Summary:');
      console.log(`   ✓ Successful: ${successCount}`);
      console.log(`   ❌ Failed: ${errorCount}`);
      
      if (errorCount === 0) {
        console.log('\n✅ Database schema updated successfully!');
      } else {
        console.log('\n⚠️  Schema update completed with some errors');
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error running schema updates:', error);
    process.exit(1);
  }
}

runSchemaUpdates();
