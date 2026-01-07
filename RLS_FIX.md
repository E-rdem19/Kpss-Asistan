# Quick Fix for RLS Policy Error

## Problem
Getting error: "new row violates row-level security policy for table 'profiles'"

## Solution

You need to re-run the updated SQL schema in Supabase to fix the policies.

### Steps:

1. **Go to your Supabase Dashboard**
   - Navigate to https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "+ New query"

3. **Run the Updated Schema**
   - Copy the ENTIRE contents of `supabase-schema.sql`
   - Paste into the SQL editor
   - Click "Run" (or press Cmd/Ctrl + Enter)

4. **Verify Policies Were Created**
   - Go to "Database" → "Tables" in the left sidebar
   - Click on the `profiles` table
   - Click the "Policies" tab
   - You should see 3 policies:
     - "Users can view own profile"
     - "Users can insert own profile"
     - "Users can update own profile"

5. **Test Again**
   - Go back to `http://localhost:5173`
   - Try signing up and creating a profile again
   - It should work now!

## What Was Fixed

- Added `DROP POLICY IF EXISTS` statements to allow re-running the schema
- Added `WITH CHECK` clauses to UPDATE policies for extra security
- Ensured all policies properly check `auth.uid()`

## Still Having Issues?

If you still get the error, try this in Supabase SQL Editor:

```sql
-- Temporarily disable RLS to test
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Try creating your profile now, then re-enable:
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
```

Then re-run the full schema again.
