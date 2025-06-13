# 🗄️ PHASE 2: DATABASE SETUP GUIDE

## 🚨 **CRITICAL: Database Schema Required for Phase 2**

The Phase 2 lesson confirmation and management system requires specific database tables that may not exist yet. **You must run the SQL schema before testing the new features.**

## 📋 **Required Tables for Phase 2:**

### 1. **lesson_requests** (Core table for booking workflow)
- `id` - Primary key
- `tutor_id` - References tutor
- `student_id` - References student  
- `requested_date` - Date of requested lesson
- `requested_start_time` - Start time
- `requested_end_time` - End time
- `status` - pending/approved/declined/cancelled
- `student_message` - Optional message from student
- `tutor_response` - Response from tutor
- `created_at`, `updated_at` - Timestamps

### 2. **Enhanced lessons table**
- Additional columns: `lesson_date`, `start_time`, `end_time`, `lesson_type`
- Updated status values to include 'confirmed'

### 3. **users table** (Unified user management)
- Role-based authentication support
- Tutor approval status tracking

## 🛠️ **Setup Instructions:**

### **Step 1: Access Supabase Dashboard**
1. Go to [https://supabase.com](https://supabase.com)
2. Sign in to your account
3. Select your project: **qbyyutebrgpxngvwenkd**

### **Step 2: Run the Schema**
1. Navigate to **SQL Editor** in the left sidebar
2. Click **"New Query"**
3. Copy the entire contents of `phase2-lesson-requests-schema.sql`
4. Paste into the SQL editor
5. Click **"Run"** to execute

### **Step 3: Verify Tables Created**
1. Go to **Table Editor** in the left sidebar
2. Confirm these tables exist:
   - ✅ `lesson_requests`
   - ✅ `lessons` (with new columns)
   - ✅ `users`

### **Step 4: Check Row Level Security**
1. In **Table Editor**, click on each table
2. Go to **"RLS"** tab
3. Confirm policies are enabled and created

## 🔍 **Verification Queries:**

Run these in SQL Editor to verify setup:

```sql
-- Check lesson_requests table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'lesson_requests';

-- Check lessons table has new columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'lessons' 
AND column_name IN ('lesson_date', 'start_time', 'end_time', 'lesson_type');

-- Check RLS policies
SELECT tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('lesson_requests', 'lessons', 'users');
```

## 🎯 **Expected Workflow After Setup:**

### **Student Booking Flow:**
1. Student clicks available time slot
2. Enhanced booking modal opens
3. Student clicks "Confirm Lesson"
4. Record created in `lesson_requests` table with status 'pending'
5. Student sees "Waiting for Approval" in My Lessons

### **Tutor Approval Flow:**
1. Tutor dashboard shows Action Required count > 0
2. Tutor clicks Action Required card
3. Navigates to lesson-requests.html
4. Tutor sees pending requests
5. Tutor approves/declines request
6. Status updated in `lesson_requests` table
7. If approved, automatic record created in `lessons` table

### **Real-time Updates:**
1. Dashboard counts update automatically
2. Supabase real-time subscriptions trigger updates
3. Both student and tutor see status changes immediately

## 🚨 **Troubleshooting:**

### **If tables don't exist:**
- Re-run the schema SQL
- Check for error messages in SQL Editor
- Verify you're in the correct project

### **If RLS policies fail:**
- Check user permissions
- Verify auth.users table exists
- Run policies individually if batch fails

### **If real-time doesn't work:**
- Check Supabase project settings
- Verify real-time is enabled
- Check browser console for connection errors

## 📊 **Testing Data (Optional):**

After setup, you can insert test data:

```sql
-- Insert test lesson request (replace UUIDs with real user IDs)
INSERT INTO lesson_requests (
    tutor_id, 
    student_id, 
    requested_date, 
    requested_start_time, 
    requested_end_time,
    student_message
) VALUES (
    'your-tutor-uuid',
    'your-student-uuid',
    CURRENT_DATE + INTERVAL '1 day',
    '14:00:00',
    '15:00:00',
    'Looking forward to our lesson!'
);
```

## ✅ **Verification Checklist:**

- [ ] `lesson_requests` table created
- [ ] `lessons` table updated with new columns
- [ ] `users` table created
- [ ] RLS policies enabled
- [ ] Triggers and functions created
- [ ] Test lesson request can be created
- [ ] Dashboard shows correct counts
- [ ] Real-time updates working

## 🎉 **Ready for Testing!**

Once the database is set up, the complete Phase 2 lesson confirmation and management system will be fully functional!

**Next Steps:**
1. Run the SQL schema
2. Test the booking workflow
3. Verify real-time updates
4. Confirm navigation works correctly
