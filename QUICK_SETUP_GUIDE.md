# Quick Setup Guide - Notifications Feature

## Step 1: Run the Notifications Table SQL

You need to create the notifications table in your Neon PostgreSQL database.

### Option A: Using Neon Console (Recommended)

1. Go to your Neon Console: https://console.neon.tech
2. Select your project
3. Click on "SQL Editor"
4. Copy and paste the contents of `add-notifications-table.sql`
5. Click "Run" to execute

### Option B: Using psql Command Line

```bash
# Replace with your actual Neon connection string
psql "postgresql://username:password@host/database?sslmode=require" < add-notifications-table.sql
```

### Option C: Using Node.js Script

Create a file `run-migration.js`:

```javascript
const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  const sql = fs.readFileSync('add-notifications-table.sql', 'utf8');
  try {
    await pool.query(sql);
    console.log('✅ Notifications table created successfully!');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

runMigration();
```

Then run:
```bash
node run-migration.js
```

## Step 2: Verify the Table Was Created

Run this query in your SQL editor:

```sql
SELECT * FROM notifications LIMIT 5;
```

You should see 3 sample notifications.

## Step 3: Test the Notifications Feature

1. **Open Citizen App:** http://localhost:5173
2. **Navigate to Alerts page** (bottom navigation)
3. **You should see:**
   - Sample notifications
   - Ability to mark as read
   - Ability to delete notifications

4. **Test Resolved Issue Notification:**
   - Open Official Dashboard: http://localhost:5176
   - Find an issue on the map
   - Click "Mark as Resolved"
   - Go back to Citizen App → Alerts
   - You should see a new notification about the resolved issue

## Step 4: Monitor Real-Time Updates

The alerts page automatically refreshes every 30 seconds to fetch new notifications.

## Troubleshooting

### Issue: "Table already exists" error
**Solution:** The table is already created. You can skip this step.

### Issue: Notifications not showing
**Solution:** 
1. Check browser console for errors
2. Verify backend is running on port 3000
3. Check database connection in `.env` file

### Issue: "Cannot read property 'notification_id'" error
**Solution:** The notifications table doesn't exist. Run the SQL migration.

## Environment Variables

Make sure your `.env` file has:

```env
DATABASE_URL=your_neon_connection_string
PORT=3000
```

## API Endpoints

The following endpoints are now available:

- `GET /api/notifications` - Get all notifications
- `GET /api/notifications?unread_only=true` - Get unread only
- `PUT /api/notifications/:id/read` - Mark as read
- `DELETE /api/notifications/:id` - Delete notification
- `POST /api/notifications` - Create notification (used by dashboard)

## Testing Checklist

- [ ] Notifications table created
- [ ] Sample notifications visible in Alerts page
- [ ] Can mark notification as read
- [ ] Can delete notification
- [ ] Resolved issue creates notification
- [ ] Real-time refresh works (wait 30 seconds)

---

**Need Help?** Check the browser console and server logs for error messages.
