# Manual Role Assignment Guide

## 🎯 **STEP-BY-STEP INSTRUCTIONS**

### **Step 1: Run the Updated SQL Script**
1. Go to your **Supabase Dashboard** → **SQL Editor**
2. Copy and paste the entire content from **`update-existing-database.sql`**
3. Click **Run** to add the role column to your students table

### **Step 2: Manually Assign Roles**
After running the SQL script, you can manually assign roles to users:

#### **Option A: Using Supabase Dashboard (Recommended)**
1. Go to **Supabase Dashboard** → **Table Editor**
2. Click on the **`students`** table
3. Find the user you want to make a tutor
4. Click on the **`role`** column for that user
5. Change the value from `'student'` to `'tutor'`
6. Save the changes

#### **Option B: Using SQL Query**
Run this SQL query in the **SQL Editor** to make a specific user a tutor:

```sql
-- Replace 'user-email@gmail.com' with the actual email
UPDATE students 
SET role = 'tutor' 
WHERE email = 'user-email@gmail.com';
```

### **Step 3: Test the System**

#### **Test as Student:**
1. Sign in with a Google account that has `role = 'student'`
2. Should redirect to `student-dashboard.html`
3. Can browse tutors and book lessons

#### **Test as Tutor:**
1. Sign in with a Google account that has `role = 'tutor'`
2. Should redirect to `tutor-dashboard.html`
3. Can add availability and see bookings

### **Step 4: How Role-Based Redirection Works**

1. **User signs in** with Google OAuth
2. **System checks** the `students` table for their `role`
3. **Redirects automatically:**
   - `role = 'student'` → `student-dashboard.html`
   - `role = 'tutor'` → `tutor-dashboard.html`

### **Step 5: Adding New Tutors**

When a new user signs up:
1. They get `role = 'student'` by default
2. **You manually change** their role to `'tutor'` in the database
3. Next time they log in, they'll be redirected to the tutor dashboard

### **Example Users Setup:**

```sql
-- Make John a tutor
UPDATE students 
SET role = 'tutor' 
WHERE email = 'john.doe@gmail.com';

-- Make Sarah a tutor  
UPDATE students 
SET role = 'tutor' 
WHERE email = 'sarah.teacher@gmail.com';

-- Keep Mike as a student (default)
-- No action needed for students
```

### **Troubleshooting:**

**Problem:** User not redirecting to correct dashboard
**Solution:** Check the `role` value in the `students` table

**Problem:** "Column role does not exist" error
**Solution:** Make sure you ran the `update-existing-database.sql` script

**Problem:** User can't see availability/lessons
**Solution:** Verify Row Level Security policies are working correctly

---

## 🚀 **READY TO TEST!**

1. **Run the SQL script** to add role column
2. **Manually assign tutor roles** to specific users
3. **Test login** with different accounts
4. **Verify role-based redirection** works correctly

The system will automatically handle everything else! 🎉
