-- ============================================
-- Add Notifications Table
-- ============================================

-- Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS notifications (
    notification_id SERIAL PRIMARY KEY,
    user_id INTEGER, -- Reference to user (for future auth integration)
    report_id INTEGER, -- Reference to report that triggered notification
    message TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'danger')),
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_report_id ON notifications(report_id);
CREATE INDEX IF NOT EXISTS idx_notifications_sent_at ON notifications(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON notifications(read_at);

-- Insert sample notifications for testing
INSERT INTO notifications (user_id, report_id, message, type, sent_at) VALUES
(1, NULL, 'Welcome to WinGuard! Your safety is our priority.', 'info', NOW() - INTERVAL '5 days'),
(1, NULL, 'New safety features available! Check out the route planner.', 'info', NOW() - INTERVAL '3 days'),
(1, NULL, 'High crime activity reported in Koramangala. Stay alert.', 'warning', NOW() - INTERVAL '2 days')
ON CONFLICT DO NOTHING;

-- Verify installation
SELECT 
    type,
    COUNT(*) as count,
    COUNT(CASE WHEN read_at IS NULL THEN 1 END) as unread_count
FROM notifications
GROUP BY type
ORDER BY type;

SELECT '✅ Notifications table created and populated!' AS status;
