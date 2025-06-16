/**
 * Database Diagnostic Tool for Phase 2 - Enhanced Version
 * Run this in browser console to check database setup
 * Updated: Comprehensive table structure analysis
 */

// Supabase Configuration
const SUPABASE_URL = 'https://qbyyutebrgpxngvwenkd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFieXl1dGVicmdweG5ndndlbmtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3MTA1NTMsImV4cCI6MjA2NTI4NjU1M30.eO8Wd0ZOqtXgvQ3BuedmSPmYVpbG3V-AXvgufLns6yY';

async function runDatabaseDiagnostic() {
    console.log('🔍 Starting Phase 2 Database Diagnostic...\n');
    
    // Initialize Supabase
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    const results = {
        tables: {},
        auth: null,
        errors: []
    };
    
    try {
        // Check authentication
        console.log('1️⃣ Checking authentication...');
        const { data: { session }, error: authError } = await supabase.auth.getSession();
        if (authError) {
            results.errors.push(`Auth Error: ${authError.message}`);
            console.log('❌ Authentication failed:', authError.message);
        } else if (session) {
            results.auth = session.user;
            console.log('✅ User authenticated:', session.user.email);
        } else {
            console.log('⚠️ No active session - please log in first');
        }
        
        // Check lesson_requests table
        console.log('\n2️⃣ Checking lesson_requests table...');
        try {
            const { data, error } = await supabase
                .from('lesson_requests')
                .select('*')
                .limit(1);
            
            if (error) {
                results.tables.lesson_requests = { exists: false, error: error.message };
                console.log('❌ lesson_requests table missing or inaccessible:', error.message);
            } else {
                results.tables.lesson_requests = { exists: true, count: data.length };
                console.log('✅ lesson_requests table exists');
            }
        } catch (err) {
            results.tables.lesson_requests = { exists: false, error: err.message };
            console.log('❌ lesson_requests table error:', err.message);
        }
        
        // Check lessons table
        console.log('\n3️⃣ Checking lessons table...');
        try {
            const { data, error } = await supabase
                .from('lessons')
                .select('*')
                .limit(1);
            
            if (error) {
                results.tables.lessons = { exists: false, error: error.message };
                console.log('❌ lessons table missing or inaccessible:', error.message);
            } else {
                results.tables.lessons = { exists: true, count: data.length };
                console.log('✅ lessons table exists');
            }
        } catch (err) {
            results.tables.lessons = { exists: false, error: err.message };
            console.log('❌ lessons table error:', err.message);
        }
        
        // Check tutors table
        console.log('\n4️⃣ Checking tutors table...');
        try {
            const { data, error } = await supabase
                .from('tutors')
                .select('*')
                .limit(1);
            
            if (error) {
                results.tables.tutors = { exists: false, error: error.message };
                console.log('❌ tutors table missing or inaccessible:', error.message);
            } else {
                results.tables.tutors = { exists: true, count: data.length };
                console.log('✅ tutors table exists');
            }
        } catch (err) {
            results.tables.tutors = { exists: false, error: err.message };
            console.log('❌ tutors table error:', err.message);
        }
        
        // Check students table
        console.log('\n5️⃣ Checking students table...');
        try {
            const { data, error } = await supabase
                .from('students')
                .select('*')
                .limit(1);
            
            if (error) {
                results.tables.students = { exists: false, error: error.message };
                console.log('❌ students table missing or inaccessible:', error.message);
            } else {
                results.tables.students = { exists: true, count: data.length };
                console.log('✅ students table exists');
            }
        } catch (err) {
            results.tables.students = { exists: false, error: err.message };
            console.log('❌ students table error:', err.message);
        }
        
        // Test real-time subscriptions
        console.log('\n6️⃣ Testing real-time subscriptions...');
        try {
            const channel = supabase
                .channel('test_channel')
                .on('postgres_changes', 
                    { event: '*', schema: 'public', table: 'lesson_requests' }, 
                    (payload) => console.log('📡 Real-time test successful:', payload)
                )
                .subscribe();
            
            setTimeout(() => {
                channel.unsubscribe();
                console.log('✅ Real-time subscription test completed');
            }, 2000);
        } catch (err) {
            results.errors.push(`Real-time error: ${err.message}`);
            console.log('❌ Real-time subscription failed:', err.message);
        }
        
    } catch (error) {
        results.errors.push(`General error: ${error.message}`);
        console.log('❌ General error:', error.message);
    }
    
    // Summary
    console.log('\n📊 DIAGNOSTIC SUMMARY:');
    console.log('='.repeat(50));
    
    const tablesExist = Object.values(results.tables).filter(t => t.exists).length;
    const totalTables = Object.keys(results.tables).length;
    
    console.log(`📋 Tables: ${tablesExist}/${totalTables} exist`);
    console.log(`👤 Authentication: ${results.auth ? '✅ Active' : '❌ Not logged in'}`);
    console.log(`🚨 Errors: ${results.errors.length}`);
    
    if (results.errors.length > 0) {
        console.log('\n🚨 ERRORS FOUND:');
        results.errors.forEach((error, index) => {
            console.log(`${index + 1}. ${error}`);
        });
    }
    
    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    if (!results.tables.lesson_requests?.exists) {
        console.log('❗ Run phase2-lesson-requests-schema.sql in Supabase SQL Editor');
    }
    if (!results.auth) {
        console.log('❗ Log in to test authenticated features');
    }
    if (results.errors.length === 0 && tablesExist === totalTables) {
        console.log('🎉 All systems ready for Phase 2 testing!');
    }
    
    return results;
}

// Auto-run if in browser console
if (typeof window !== 'undefined' && window.supabase) {
    console.log('🚀 Running Database Diagnostic...');
    runDatabaseDiagnostic();
} else {
    console.log('⚠️ Please run this in a browser with Supabase loaded');
    console.log('📋 Copy and paste this entire script into browser console on your app page');
}

// Export for manual use
window.runDatabaseDiagnostic = runDatabaseDiagnostic;
