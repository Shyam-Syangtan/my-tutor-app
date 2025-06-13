# 🗄️ **SUB-PHASE 2: Database Setup Guide**

## **Step 1: Run Database Diagnostic**

1. **Open your tutor dashboard**: https://shyam-syangtan.github.io/my-tutor-app/tutor-dashboard.html
2. **Open browser console** (F12 → Console tab)
3. **Copy and paste the diagnostic script** from `database-diagnostic.js`
4. **Review the results** to see which tables are missing

## **Step 2: Execute SQL Schema**

1. **Open Supabase Dashboard**: https://supabase.com/dashboard
2. **Navigate to SQL Editor**: Left sidebar → SQL Editor
3. **Create new query** and paste the contents of `phase2-lesson-requests-schema.sql`
4. **Run the query** (Click "Run" button)

## **Step 3: Verify Setup**

After running the SQL schema, run the diagnostic again to confirm:
- ✅ `lesson_requests` table exists
- ✅ `lessons` table has required columns
- ✅ `users` table exists
- ✅ RLS policies are active
- ✅ Indexes are created

## **Expected Results After Setup**

```
📊 DIAGNOSTIC SUMMARY:
==================================================
📋 Tables: 4/4 exist
👤 Authentication: ✅ Active  
🚨 Errors: 0

💡 RECOMMENDATIONS:
🎉 All systems ready for Phase 2 testing!
```

## **Troubleshooting**

### **Common Issues:**

1. **"Table doesn't exist" errors**
   - Solution: Run the SQL schema in Supabase SQL Editor

2. **"Permission denied" errors**
   - Solution: Check RLS policies are properly set up

3. **"Column doesn't exist" errors**
   - Solution: The schema includes ALTER TABLE statements to add missing columns

### **Manual Table Creation (If Needed):**

If the automated schema fails, you can create tables manually:

```sql
-- Minimal lesson_requests table
CREATE TABLE lesson_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_id UUID NOT NULL,
    student_id UUID NOT NULL,
    requested_date DATE NOT NULL,
    requested_start_time TIME NOT NULL,
    requested_end_time TIME NOT NULL,
    status TEXT DEFAULT 'pending',
    student_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE lesson_requests ENABLE ROW LEVEL SECURITY;

-- Basic policies
CREATE POLICY "Users can view own requests" ON lesson_requests
    FOR SELECT USING (auth.uid() = student_id OR auth.uid() = tutor_id);
```

## **Next Steps After Setup**

Once database setup is complete:
1. ✅ Run diagnostic to confirm all tables exist
2. ➡️ Proceed to **Sub-Phase 3: Basic Lesson Request Workflow**
3. 🧪 Test booking functionality end-to-end

---

## **Quick Commands**

**Run Diagnostic:**
```javascript
// Paste this in browser console
runDatabaseDiagnostic();
```

**Check Table Structure:**
```sql
-- Run in Supabase SQL Editor
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('lesson_requests', 'lessons', 'users')
ORDER BY table_name, ordinal_position;
```
