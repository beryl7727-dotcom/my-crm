# Quick Start Guide - CRM Authentication Setup

## 📋 Prerequisites
- Supabase account (https://supabase.com)
- Node.js installed
- This repository cloned

## ⚡ 5-Minute Setup

### Step 1: Create Supabase Project (2 min)
1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Name it "my-crm" or whatever you prefer
4. Wait for it to provision

### Step 2: Get Your Credentials (1 min)
1. Open your project
2. Go to **Settings → API**
3. Copy `Project URL` → Your `VITE_SUPABASE_URL`
4. Copy `anon public` key → Your `VITE_SUPABASE_ANON_KEY`

### Step 3: Setup Environment (1 min)
```bash
cd my-crm
cp .env.local.example .env.local
```

Edit `.env.local`:
```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
```

### Step 4: Create Database Schema (1 min)
1. In Supabase, go to **SQL Editor**
2. Click **New Query**
3. Open [DATABASE_SCHEMA.sql](DATABASE_SCHEMA.sql) locally
4. Copy all the SQL and paste into Supabase
5. Click **Run**
6. Verify: Check **Tables** in left sidebar - should see `profiles` and `teams`

### Step 5: Run Locally
```bash
npm install
npm run dev
```

Visit: http://localhost:5173

## 🧪 Test the Flow

### Test 1: Sign Up
1. Go to http://localhost:5173
2. Redirects to login, click "Sign up"
3. Enter: email@test.com, password (8+ chars), confirm
4. Click "Create Account"
5. ✅ Should show team creation form

### Test 2: Create Team
1. Enter team name: "My Sales Team"
2. Click "Create Team"
3. ✅ Should redirect to dashboard with "Welcome to your CRM"

### Test 3: Sign Out & Sign Back In
1. Refresh page, you should still see dashboard (persisted session)
2. Try signing out (add button to dashboard)
3. Redirect to login
4. Sign in with same credentials
5. ✅ Should go straight to dashboard

### Test 4: Join Team (Invite Code)
1. Open private/incognito window
2. Create new account
3. On team setup, click "Join Team"
4. Get invite code from first account (Teams table in Supabase)
5. Paste invite code and join
6. ✅ Both users should see same team in dashboard

## 🐛 If Something Breaks

### "Missing Supabase environment variables"
- Check `.env.local` exists and has values
- Restart `npm run dev`
- Check for typos in VITE_ variable names

### "User not found" or signin fails
- Make sure database schema was created
- Check Supabase auth is enabled (should be by default)
- Check if user exists in Supabase Auth users

### "Can't join team" / "Invalid invite code"
- Get the actual invite code from Supabase `teams` table
- Make sure you're entering it exactly (it's uppercase)
- New invite codes are generated on team creation

### Forms not submitting
- Open browser DevTools Console (F12)
- Check for errors
- Verify network tab shows requests to Supabase

## 📁 Files You'll Work With

### To Add to Dashboard Later
- Add a sign out button: `useAuth()` hook
- Display current user: `useAuth().user.email`
- Display team: `useTeam().currentTeam.name`
- New pages: Create in `src/pages/` folder

### Key Files Reference
- **Routes**: [src/App.jsx](src/App.jsx)
- **Auth Logic**: [src/context/AuthContext.jsx](src/context/AuthContext.jsx)
- **Supabase Setup**: [src/lib/supabase.ts](src/lib/supabase.ts)
- **Protected Page Example**: [src/components/ProtectedRoute.jsx](src/components/ProtectedRoute.jsx)

## 🚀 What's Next?

1. ✅ Auth foundation complete
2. Add sign out button to dashboard
3. Add user profile page
4. Add team members management
5. Add CRM features (contacts, deals, etc.)

## 📚 Documentation
- Full setup details: [SETUP.md](SETUP.md)
- Build summary: [AUTH_SETUP_COMPLETE.md](AUTH_SETUP_COMPLETE.md)
- Database schema: [DATABASE_SCHEMA.sql](DATABASE_SCHEMA.sql)

## 💡 Quick Code Examples

### Getting current user
```javascript
import { useAuth } from './hooks/useAuth';

function MyComponent() {
  const { user } = useAuth();
  return <p>Hello, {user?.email}</p>;
}
```

### Getting current team
```javascript
import { useTeam } from './hooks/useTeam';

function MyComponent() {
  const { currentTeam } = useTeam();
  return <p>Team: {currentTeam?.name}</p>;
}
```

### Show toast notification
```javascript
import { toast } from './utils/toast';

toast.success('Saved!');
toast.error('Something went wrong');
```

---

**Your CRM is ready to build on! 🎉**
