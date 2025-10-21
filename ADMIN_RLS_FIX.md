# Admin RLS Policy Fix - IMPORTANT

## Problem
The "Override & Approve" feature is not working because database Row Level Security (RLS) policies are blocking the update operation.

### Current Situation
- The admin user's role is stored in `user_metadata.role = 'admin'`
- The RLS policies only check `app_metadata.role` or `jwt.role`
- This mismatch causes UPDATE operations to fail silently (no error shown, but database isn't updated)
- On page refresh, changes revert because they were never saved to the database

## Recommended Solution
Run the provided SQL script to update ALL admin RLS policies to check multiple locations for the admin role.

### EASY FIX: Run the SQL Script (Recommended)

1. Open the `FIX_ADMIN_RLS_POLICIES.sql` file in this project
2. Go to your Supabase Dashboard
3. Navigate to SQL Editor
4. Create a new query
5. Copy and paste the entire contents of `FIX_ADMIN_RLS_POLICIES.sql`
6. Click "Run" to execute the script
7. Log out and log back in to the admin dashboard
8. Try the "Override & Approve" button again

This script updates RLS policies for:
- campaigns table
- donations table
- pack_orders table
- messages table (if it exists)

The updated policies now check for admin role in:
- `jwt.role`
- `app_metadata.role`
- `user_metadata.role` (your current setup)
- Direct email check for `admin@yspi.ie`

### Alternative: Update Admin User Metadata

If you prefer to change where the admin role is stored instead of updating policies:

1. Go to your Supabase Dashboard
2. Navigate to Authentication → Users
3. Find the admin user (admin@yspi.ie)
4. Click on the user
5. In the "Raw App Meta Data" section, add:
   ```json
   {
     "role": "admin"
   }
   ```
6. Save the changes
7. Log out and log back in

This moves the role to `app_metadata` where the existing policies expect it.

## Verification
After applying the fix:
1. Log out of the admin dashboard
2. Log back in
3. Try to override and approve a pending campaign
4. Check the browser console for logs showing:
   - "Attempting to override and approve campaign: [id]"
   - "Update result: { data: [...], error: null }"
5. Refresh the page - the campaign should remain in "Live" status

## Added Features in This Update
1. **Enhanced Logging**: Console logs now show detailed information about the update operation
2. **Better Error Messages**: Error toasts now display the actual error message from the database
3. **Auto-Refresh**: After successful update, campaigns are reloaded from the database to ensure UI shows current state
4. **Confirmation Dialog**: Prevents accidental overrides
