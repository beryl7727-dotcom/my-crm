# URGENT: Fix Row Level Security (RLS) Error for Teams Table

## Quick Fix (Copy & Paste in Supabase)

Go to your Supabase project → SQL Editor → New Query and run this exactly:

```sql
-- Step 1: Disable RLS temporarily to clean up policies
ALTER TABLE teams DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies on teams table
DROP POLICY IF EXISTS "Teams are publicly readable" ON teams;
DROP POLICY IF EXISTS "Only team creators can update their team" ON teams;
DROP POLICY IF EXISTS "Only team creators can delete their team" ON teams;
DROP POLICY IF EXISTS "Service role can insert teams" ON teams;
DROP POLICY IF EXISTS "Users can create teams" ON teams;
DROP POLICY IF EXISTS "Team creators can update their team" ON teams;
DROP POLICY IF EXISTS "Team creators can delete their team" ON teams;

-- Step 3: Re-enable RLS
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- Step 4: Create correct policies (ONE AT A TIME)
-- Policy 1: Anyone can READ teams
CREATE POLICY "Teams are publicly readable"
  ON teams FOR SELECT
  USING (true);

-- Policy 2: Users can INSERT teams only if they are the creator
CREATE POLICY "Users can create teams"
  ON teams FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Policy 3: Only creators can UPDATE their teams
CREATE POLICY "Team creators can update"
  ON teams FOR UPDATE
  USING (auth.uid() = created_by);

-- Policy 4: Only creators can DELETE their teams
CREATE POLICY "Team creators can delete"
  ON teams FOR DELETE
  USING (auth.uid() = created_by);

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, qual, with_check
FROM pg_policies 
WHERE tablename = 'teams'
ORDER BY policyname;
```

After running this, **refresh your browser and try creating a team again**.

---

## If It Still Doesn't Work

Open browser Developer Tools (F12) and check the Network tab:
1. Go to /auth/create-team
2. Enter a team name
3. Click "Create Team"
4. In DevTools Network tab, find the request to Supabase
5. Click it and copy the full error message
6. Share that error message

Also try this SQL query in Supabase to verify RLS is actually enabled:

```sql
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'teams';
```

Should return: `rowsecurity = true`

---

## Alternative: Disable RLS (For Testing Only)

If you want to test without RLS for now, run this:

```sql
ALTER TABLE teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
```

This will let you create teams. Then we can debug the RLS policies properly.

**WARNING**: Only disable RLS for testing. Re-enable it before production!

To re-enable:
```sql
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
```

---

## The Fix Explained

The RLS policy `WITH CHECK (auth.uid() = created_by)` means:
- When you insert a new team, Supabase checks: "Is the current user's ID equal to the `created_by` value?"
- In your code, we do: `created_by: user.id`
- This matches, so the insert is allowed ✅

If you're still getting the error, it means either:
1. RLS policies are conflicting (the cleanup SQL above fixes this)
2. The user isn't properly authenticated (check your `.env.local` has correct Supabase URL/key)
3. Supabase session expired (logout and login again)
