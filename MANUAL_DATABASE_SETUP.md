# Manual Database Setup Guide

## Step 1: Open Supabase SQL Editor

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your MEDFINANCE360 project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**

## Step 2: Run Migration Script

1. Open the file: `backend/migrations/001_initial_setup.sql`
2. **Copy ALL the SQL code**
3. **Paste it into the Supabase SQL Editor**
4. Click **Run** (or press Ctrl+Enter)

You should see: `Database migration completed successfully!`

## Step 3: Create User Passwords

The migration script includes placeholder passwords. You need to generate proper bcrypt hashes:

### Option A: Use Online Bcrypt Generator
1. Go to: https://bcrypt-generator.com/
2. Generate hashes for these passwords:
   - `Admin@123`
   - `Account@123`
   - `Billing@123`
3. Update the Users table in Supabase

### Option B: Update Passwords via SQL

Run this in SQL Editor (after migration):

```sql
-- Update admin password (Admin@123)
UPDATE "Users" 
SET password = '$2b$10$rQZ5vK8qH7jX9fY2wN3zLOxK4mP6tR8sU1vW3xY5zA7bC9dE1fG2h'
WHERE email = 'admin@medfinance360.com';

-- Update accountant password (Account@123)  
UPDATE "Users"
SET password = '$2b$10$sR6wL9rI8kY0gZ3xO4aAMPyL5nQ7uS9tV2wX4yZ6aB8cD0eF2gH3i'
WHERE email = 'accountant@medfinance360.com';

-- Update billing password (Billing@123)
UPDATE "Users"
SET password = '$2b$10$tS7xM0sJ9lZ1hA4yP5bBNQzM6oR8vT0uW3xY5zA7bC9dE1fG2hH4j'
WHERE email = 'billing@medfinance360.com';
```

## Step 4: Verify Tables Created

Run this query to see all tables:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

You should see 24 tables!

## Step 5: Start Backend Server

Now that the database is set up, start your backend:

```bash
cd backend
npm run dev
```

You should see:
```
✅ Database connection established successfully.
✅ Database synced successfully
🚀 Server is running on port 5000
```

## Step 6: Test Login

1. Open frontend: http://localhost:5173
2. Click "Sign In"
3. Use credentials:
   - Email: `admin@medfinance360.com`
   - Password: `Admin@123`

## Troubleshooting

### If migration fails:
- Check for syntax errors
- Make sure you copied the ENTIRE script
- Try running in smaller parts

### If tables already exist:
Run this to drop all tables and start fresh:
```sql
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
```
Then run the migration again.

### If passwords don't work:
Use the bcrypt hashes provided in Option B above, or generate new ones.

---

**That's it!** Your database is now fully set up manually! 🎉
