# Fix for Row Level Security Error - Team Creation

## Problem
When creating a team, you get this error:
```
new row violates row-level security policy for table 'teams'
```

## Root Cause
The RLS policy on the teams table was not properly configured to validate the `created_by` field.

## Solution

### Option 1: If You Haven't Run Database Schema Yet
Just run the updated [DATABASE_SCHEMA.sql](DATABASE_SCHEMA.sql) file as-is. The corrected RLS policy is already included.

### Option 2: If You Already Ran the Old Schema
You need to update the RLS policy. Run this SQL in your Supabase SQL Editor:

```sql
-- Drop the old incorrect policy
DROP POLICY IF EXISTS "Service role can insert teams" ON teams;

-- Create the correct policy
CREATE POLICY "Users can create teams"
  ON teams FOR INSERT
  WITH CHECK (auth.uid() = created_by);
```

That's it! This ensures users can only insert teams where they set themselves as the `created_by`.

---

## What Changed in CreateTeam.jsx

The updated file now:

1. **Checks user authentication** - Verifies `user` and `user.id` exist before inserting
2. **Explicitly sets created_by** - `created_by: user.id` is set when creating the team
3. **Better error handling** - Catches specific RLS errors and displays clear messages
4. **Validates response** - Confirms team was created and has an ID before updating profile
5. **Logs errors** - Console logs for debugging (remove in production if needed)
6. **Trims input** - Removes whitespace from team name
7. **Case-insensitive invite codes** - Converts to uppercase for consistency

---

## Testing After Fix

1. Go to `/auth/create-team`
2. Enter a team name
3. Click "Create Team"
4. Should redirect to dashboard with success toast
5. If error persists:
   - Check Supabase SQL Editor that the new policy exists
   - Check browser console for detailed error message
   - Verify your `.env.local` has correct Supabase credentials

---

## If You Still Get RLS Error

Try this SQL to see what policies exist on the teams table:

```sql
SELECT schemaname, tablename, policyname FROM pg_policies 
WHERE tablename = 'teams';
```

You should see:
- `Teams are publicly readable` (for SELECT)
- `Users can create teams` (for INSERT)
- `Team creators can update their team` (for UPDATE)
- `Team creators can delete their team` (for DELETE)

If the old `Service role can insert teams` policy still exists, drop it:
```sql
DROP POLICY IF EXISTS "Service role can insert teams" ON teams;
```

---

## Key Code Changes in CreateTeam.jsx

```javascript
// Before: Would fail with RLS error
const { data: teamData, error: teamError } = await supabase
  .from('teams')
  .insert([{
    name: teamName,
    invite_code: newInviteCode,
    created_by: user.id, // This wasn't validated properly
  }])

// After: RLS policy now validates created_by = auth.uid()
if (!user || !user.id) {
  // Check auth before attempting insert
  throw new Error('User not authenticated');
}

const { data: teamData, error: teamError } = await supabase
  .from('teams')
  .insert([{
    name: teamName.trim(),
    invite_code: newInviteCode,
    created_by: user.id, // RLS policy now validates this
  }])

if (teamError) {
  // Better error handling
  throw new Error(teamError.message || 'Failed to create team');
}
```

---

## Complete Fix Checklist

- [ ] Update RLS policy in Supabase (run the SQL above)
- [ ] Replace your `src/pages/auth/CreateTeam.jsx` with the updated version
- [ ] Clear browser cache (Ctrl+Shift+Delete or Cmd+Shift+Delete)
- [ ] Restart `npm run dev`
- [ ] Test: Try creating a team again
- [ ] If it works, test: Try joining a team with invite code
