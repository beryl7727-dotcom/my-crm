# Authentication & CRM Setup Guide

## Project Structure
```
src/
├── lib/
│   └── supabase.ts          # Supabase client & types
├── context/
│   ├── AuthContext.jsx      # Auth state management
│   └── TeamContext.jsx      # Team state management
├── hooks/
│   ├── useAuth.js          # Auth hook
│   └── useTeam.js          # Team hook
├── pages/auth/
│   ├── Login.jsx           # Sign in page
│   ├── Signup.jsx          # Sign up page
│   └── CreateTeam.jsx      # Team creation/joining
├── components/
│   └── ProtectedRoute.jsx  # Auth-protected route wrapper
└── utils/
    └── toast.js            # Toast notifications
```

## Environment Setup

1. Copy `.env.local.example` to `.env.local`
2. Get your Supabase credentials:
   - Go to https://supabase.com/dashboard
   - Create a new project (or use existing)
   - Find `Settings > API` for URL and anon key
   - Paste into `.env.local`

3. Install dependencies:
   ```bash
   npm install
   ```

## Database Schema Required

Create these tables in Supabase SQL Editor:

```sql
-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  team_id UUID REFERENCES teams(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Teams table
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Anyone can read teams
CREATE POLICY "Teams are readable"
  ON teams FOR SELECT
  USING (true);
```

## Authentication Flow

### Sign Up
1. User enters email, password, password confirmation
2. Form validates:
   - Email format
   - Password length (8+ chars)
   - Password match
3. Creates auth.users entry
4. Creates profiles table entry
5. Redirects to team creation

### Sign In
1. User enters email and password
2. Checks rememberMe checkbox (optional)
3. Supabase validates credentials
4. Stores session in browser
5. Redirects to dashboard if team exists, else to team creation

### Team Setup
- **Create**: New users create a team, get an invite code
- **Join**: Existing users join via invite code
- Team ID stored in profiles.team_id

### Protected Routes
- ProtectedRoute checks:
  1. User is authenticated
  2. User has a team assigned
  3. Shows spinner while loading
  4. Redirects to login if not authenticated

## Usage

### useAuth Hook
```javascript
import { useAuth } from './hooks/useAuth';

function MyComponent() {
  const { user, loading, error, signOut } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Not logged in</div>;
  
  return (
    <div>
      <p>Welcome, {user.email}</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

### useTeam Hook
```javascript
import { useTeam } from './hooks/useTeam';

function MyComponent() {
  const { currentTeam, loading } = useTeam();
  
  if (loading) return <div>Loading...</div>;
  return <div>Team: {currentTeam.name}</div>;
}
```

### Toast Notifications
```javascript
import { toast } from './utils/toast';

toast.success('Success message');
toast.error('Error message');
toast.warning('Warning message');
toast.info('Info message');
```

## Next Steps

1. Add your Supabase credentials to `.env.local`
2. Create the database schema
3. Test auth flow: Sign up → Create team → Access dashboard
4. Add your dashboard page components
5. Implement CRM features (contacts, deals, etc.)

## Common Issues

- **"Missing Supabase environment variables"**: Check `.env.local` has VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
- **"Invalid login credentials"**: Email doesn't exist or password is wrong
- **"User already exists"**: That email is already registered
- **Auth state not persisting**: Check browser localStorage is enabled
- **Can't join team**: Verify invite code is correct (case-insensitive)
