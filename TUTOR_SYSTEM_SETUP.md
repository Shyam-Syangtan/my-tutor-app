# 🎓 Tutor System Setup Instructions

## 🎯 **WHAT'S BEEN IMPLEMENTED**

### ✅ **Complete Become a Tutor System:**
1. **Become Tutor Page** (`become-tutor.html`) - Application form
2. **Tutor Dashboard** (`tutor-dashboard.html`) - For approved tutors
3. **Dynamic Toggle System** - Switch between student/teacher modes
4. **Approval Workflow** - Admin approval required
5. **Updated Find Teacher** - Only shows approved tutors

---

## 🔧 **WHAT YOU NEED TO DO IN SUPABASE**

### **Step 1: Update Your Tutors Table**
1. Go to **Supabase Dashboard** → **SQL Editor**
2. Copy and paste the entire content from **`update-tutors-table.sql`**
3. Click **Run** to add the new columns and policies

### **Step 2: Test the System**

#### **Test as Student (Default):**
1. Sign in with Google
2. Go to Home page
3. You should see **"🎓 Become a Tutor"** in the profile dropdown
4. Click it to apply as a tutor

#### **Test Tutor Application:**
1. Fill out the become tutor form
2. Submit the application
3. Check your **Supabase** → **Table Editor** → **tutors** table
4. You should see a new row with `approved = false`

#### **Test Admin Approval:**
1. In Supabase, find the tutor record
2. Change `approved` from `false` to `true`
3. Save the changes

#### **Test Approved Tutor:**
1. Sign in again with the same account
2. You should now see **"🎓 Switch to Teacher Mode"** in dropdown
3. Click it to go to tutor dashboard
4. Your profile should appear on the "Find a Teacher" page

---

## 🎯 **HOW THE SYSTEM WORKS**

### **User Flow:**
1. **New User** → Signs up → Default student mode
2. **Wants to Teach** → Clicks "Become a Tutor" → Fills application
3. **Admin Reviews** → Manually approves in Supabase
4. **Approved Tutor** → Can switch between student/teacher modes

### **Dynamic Toggle Logic:**
- **No Application** → Shows "Become a Tutor"
- **Pending Application** → Shows "📋 Tutor application pending"
- **Approved Tutor** → Shows "🎓 Switch to Teacher Mode"

### **Database Structure:**
```sql
tutors table:
- user_id (UUID) → Links to auth.users
- approved (BOOLEAN) → Admin approval status
- name, bio, language, rate, experience
- video_url, specialties, availability
- created_at, updated_at
```

---

## 🚀 **FEATURES INCLUDED**

### **Become Tutor Form:**
- ✅ Personal information (name, bio)
- ✅ Teaching details (languages, experience, rate)
- ✅ Google Drive video link
- ✅ Specialties and availability
- ✅ Form validation and submission

### **Tutor Dashboard:**
- ✅ Profile overview with stats
- ✅ Teaching information display
- ✅ Quick actions (placeholders for future features)
- ✅ Switch back to student mode

### **Admin Approval:**
- ✅ Manual approval in Supabase
- ✅ Only approved tutors visible on Find Teacher page
- ✅ Pending status shown to applicants

### **Security:**
- ✅ Row Level Security policies
- ✅ Users can only edit their own profiles
- ✅ Only approved tutors visible publicly

---

## 📋 **ADMIN TASKS**

### **To Approve a Tutor:**
1. Go to **Supabase** → **Table Editor** → **tutors**
2. Find the applicant's row
3. Change `approved` from `false` to `true`
4. Save changes

### **To Review Applications:**
- Check `approved = false` rows
- Review their video_url, bio, experience
- Approve or reject as needed

### **To Monitor System:**
- Check new applications regularly
- Monitor tutor profiles on Find Teacher page
- Ensure only quality tutors are approved

---

## 🎉 **READY TO TEST!**

1. **Run the SQL script** (`update-tutors-table.sql`)
2. **Test the complete flow** from application to approval
3. **Verify the toggle system** works correctly
4. **Check Find Teacher page** shows only approved tutors

**Your complete tutor system with approval workflow is ready! 🚀**
