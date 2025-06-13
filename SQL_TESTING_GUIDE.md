# 🗄️ **SQL Testing Guide - Phase 2 Debugging**

## 🎯 **Quick Database Testing for Student Booking System**

Since students can now see availability, let's verify the database is working correctly with proper SQL queries.

---

## 🔍 **Step 1: Get Real UUIDs from Your Database**

**Run this first to get actual UUIDs:**
```sql
-- Get tutors with their UUIDs
SELECT id, name, user_id FROM tutors LIMIT 5;
```

**Expected Result:**
```
id                                   | name          | user_id
-------------------------------------|---------------|-------------------------------------
456e7890-e12b-34d5-a678-901234567890 | John Smith    | 123e4567-e89b-12d3-a456-426614174000
789e0123-e45b-67d8-a901-234567890123 | Maria Garcia  | 234e5678-e90b-23d4-a567-537625285111
```

---

## 🔍 **Step 2: Test Availability Queries with Real UUIDs**

**Replace the UUIDs below with actual ones from Step 1:**

```sql
-- Check if tutor has set any availability (use user_id from step 1)
SELECT * FROM tutor_availability 
WHERE tutor_id = '123e4567-e89b-12d3-a456-426614174000';
```

**Expected Result (if tutor set availability):**
```
id          | tutor_id     | day_of_week | start_time | end_time | is_available
------------|--------------|-------------|------------|----------|-------------
uuid-here   | 123e4567...  | 1          | 09:00:00   | 10:00:00 | true
uuid-here   | 123e4567...  | 1          | 10:00:00   | 11:00:00 | true
```

---

## 🔍 **Step 3: Verify Tutor-Availability Relationship**

**Test the join between tutors and availability:**
```sql
-- Check relationship (use tutors.id from step 1)
SELECT t.name, t.id as record_id, t.user_id, ta.day_of_week, ta.start_time
FROM tutors t
LEFT JOIN tutor_availability ta ON t.user_id = ta.tutor_id
WHERE t.id = '456e7890-e12b-34d5-a678-901234567890';
```

**Expected Result:**
```
name       | record_id    | user_id      | day_of_week | start_time
-----------|--------------|--------------|-------------|------------
John Smith | 456e7890...  | 123e4567...  | 1          | 09:00:00
John Smith | 456e7890...  | 123e4567...  | 1          | 10:00:00
```

---

## 🔍 **Step 4: Get All Tutor Availability (No UUIDs Needed)**

**Safe query that works without specific UUIDs:**
```sql
-- Get all tutor availability relationships
SELECT t.name, t.id as record_id, t.user_id, ta.day_of_week, ta.start_time, ta.end_time
FROM tutors t
LEFT JOIN tutor_availability ta ON t.user_id = ta.tutor_id
ORDER BY t.name, ta.day_of_week, ta.start_time;
```

---

## 🧪 **Step 5: Use the Debug Tool for Easy Testing**

1. Go to **debug-database.html**
2. Click **"Load Tutors"** to see all tutors with UUIDs
3. Click **"Generate SQL Queries"** to get copy-paste ready SQL
4. Copy the generated queries to Supabase SQL Editor

---

## 🎯 **What Each Query Tests:**

### **Query 1: Basic Tutors Data**
- ✅ Confirms tutors table exists and has data
- ✅ Shows the relationship between `tutors.id` and `tutors.user_id`
- ✅ Provides UUIDs for other queries

### **Query 2: Availability Data**
- ✅ Tests if tutor has set availability in tutor-calendar.html
- ✅ Verifies `tutor_availability` table structure
- ✅ Confirms RLS policies allow reading

### **Query 3: Relationship Verification**
- ✅ Tests the JOIN between tutors and tutor_availability
- ✅ Confirms foreign key relationship works
- ✅ Shows how profile pages resolve availability

### **Query 4: Complete Overview**
- ✅ Shows all tutors and their availability
- ✅ Identifies tutors with no availability set
- ✅ Provides complete system overview

---

## 🚨 **Common Issues & Solutions:**

### **Issue: "No rows returned"**
**Cause:** Tutor hasn't set availability yet
**Solution:** Go to tutor-calendar.html and set some available slots

### **Issue: "invalid input syntax for type uuid"**
**Cause:** Using placeholder text instead of real UUID
**Solution:** Copy actual UUIDs from Step 1 queries

### **Issue: "permission denied"**
**Cause:** RLS policies blocking access
**Solution:** Ensure you're authenticated in Supabase dashboard

### **Issue: "relation does not exist"**
**Cause:** Database tables not created
**Solution:** Run calendar-database-setup.sql script

---

## ✅ **Success Indicators:**

When everything is working correctly:
- ✅ **Step 1** returns tutor records with valid UUIDs
- ✅ **Step 2** shows availability data (if tutor set any)
- ✅ **Step 3** shows proper JOIN results
- ✅ **Step 4** displays complete tutor-availability overview
- ✅ **Profile pages** show real availability to students

---

## 🌐 **Quick Links:**

- **Debug Tool**: debug-database.html
- **Tutor Calendar**: tutor-calendar.html
- **Student View**: profile.html?id=tutor-record-id
- **Supabase Dashboard**: https://supabase.com/dashboard

**Use these SQL queries to verify your database is properly configured for the student booking system!** 🗄️✨
