> **Author:** Lubuto Chabusha  
> **Developed:** 2026

# MEDFINANCE360 - Quick Start with Supabase

## 🚀 Quick Setup (5 minutes)

### 1. Create Supabase Account
- Go to [supabase.com](https://supabase.com)
- Sign up (it's free!)
- Create a new project named "MEDFINANCE360"
- **Save your database password!**

### 2. Get Connection Details
- In Supabase Dashboard → Settings → Database
- Copy the connection details

### 3. Update Backend .env
Create/edit `backend/.env`:

```env
PORT=5000
NODE_ENV=development

# Replace with YOUR Supabase details:
DB_HOST=db.xxxxxxxxxxxxx.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your_password_here

JWT_SECRET=change-this-to-a-long-random-string-min-32-characters
JWT_EXPIRES_IN=7d

CORS_ORIGIN=http://localhost:5173
```

### 4. Seed Database
```bash
cd backend
npm run seed
```

### 5. Start Servers
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

### 6. Open App
- Frontend: http://localhost:5173
- Backend: http://localhost:5000

### 7. Login
Use demo credentials:
- **Admin**: admin@medfinance360.com / Admin@123

---

## 📚 Full Documentation
See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for detailed instructions.

## ✅ What You Get
- 67 REST API endpoints
- 24 database models
- Complete billing system
- Financial management
- Reports & analytics
- Beautiful UI with Suno design

**Enjoy MEDFINANCE360!** 🎉
