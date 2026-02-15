# Supabase Setup Guide for MEDFINANCE360

## Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click **"New Project"**
4. Fill in the details:
   - **Name**: MEDFINANCE360
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to you (e.g., Singapore, Europe)
   - **Pricing Plan**: Free tier is perfect for development

## Step 2: Get Database Connection Details

After project is created:

1. Go to **Project Settings** (gear icon in sidebar)
2. Click **Database** tab
3. Scroll to **Connection String** section
4. Copy the **URI** (it looks like this):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxxx.supabase.co:5432/postgres
   ```

## Step 3: Update Backend .env File

Open `backend/.env` and update with your Supabase credentials:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Supabase Database Configuration
DB_HOST=db.xxxxxxxxxxxxx.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your_database_password_here

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:5173
```

**Important**: Replace:
- `db.xxxxxxxxxxxxx.supabase.co` with your actual Supabase host
- `your_database_password_here` with your database password

## Step 4: Seed the Database

After updating `.env`, run:

```bash
cd backend
npm run seed
```

This will create all tables and insert initial data (users, departments, services, chart of accounts).

## Step 5: Start the Backend Server

```bash
npm run dev
```

You should see:
```
✅ Database connection established successfully.
✅ Database synced successfully
🚀 Server is running on port 5000
```

## Step 6: Start the Frontend

In a new terminal:

```bash
cd frontend
npm run dev
```

Frontend will run on `http://localhost:5173`

## Demo Credentials

After seeding, you can log in with:

- **Admin**: admin@medfinance360.com / Admin@123
- **Accountant**: accountant@medfinance360.com / Account@123
- **Billing Staff**: billing@medfinance360.com / Billing@123

## Troubleshooting

### Connection Issues

If you get connection errors:

1. **Check Supabase Project Status**: Make sure it's active (not paused)
2. **Verify Credentials**: Double-check host, password in `.env`
3. **Check SSL**: Supabase requires SSL, but Sequelize handles this automatically

### Database Already Exists Error

If tables already exist and you want to reset:

1. Go to Supabase Dashboard → **SQL Editor**
2. Run this to drop all tables:
   ```sql
   DROP SCHEMA public CASCADE;
   CREATE SCHEMA public;
   ```
3. Then run `npm run seed` again

## Supabase Dashboard Features

You can use Supabase dashboard to:

- **Table Editor**: View and edit data directly
- **SQL Editor**: Run custom queries
- **Database**: Monitor connections and performance
- **API**: Auto-generated REST and GraphQL APIs (we're using our custom APIs)

## Production Deployment

For production:

1. Create a new Supabase project for production
2. Update production `.env` with production database credentials
3. Set `NODE_ENV=production`
4. Use a strong `JWT_SECRET`

---

**You're all set!** 🎉 Supabase provides a reliable, scalable PostgreSQL database for MEDFINANCE360.
