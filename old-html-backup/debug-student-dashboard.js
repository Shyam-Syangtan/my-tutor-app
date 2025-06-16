// Add this to the bottom of student-dashboard.js or include in a separate file
async function debugStudentDashboard() {
    console.log('🔍 Starting student dashboard debug...');
    
    try {
        // Get current user
        const currentUser = window.authHandler.getCurrentUser();
        console.log('👤 Current user:', currentUser);
        
        // Try direct query first
        console.log('📊 Testing direct query...');
        const { data: directData, error: directError } = await window.authHandler.supabase
            .from('lessons')
            .select('*')
            .eq('student_id', currentUser.id);
            
        console.log('Direct query results:', {
            success: !directError,
            error: directError,
            count: directData?.length || 0,
            data: directData
        });
        
        // Try optimized function
        console.log('📊 Testing optimized function...');
        const { data: optimizedData, error: optimizedError } = await window.authHandler.supabase
            .rpc('get_student_lessons_optimized', { student_user_id: currentUser.id });
            
        console.log('Optimized function results:', {
            success: !optimizedError,
            error: optimizedError,
            count: optimizedData?.length || 0,
            data: optimizedData
        });
        
        // Try final function
        console.log('📊 Testing final function...');
        const { data: finalData, error: finalError } = await window.authHandler.supabase
            .rpc('get_student_lessons_final', { student_user_id: currentUser.id });
            
        console.log('Final function results:', {
            success: !finalError,
            error: finalError,
            count: finalData?.length || 0,
            data: finalData
        });
        
        // Check approved requests
        console.log('📊 Checking approved requests...');
        const { data: approvedRequests, error: requestsError } = await window.authHandler.supabase
            .from('lesson_requests')
            .select('*')
            .eq('student_id', currentUser.id)
            .eq('status', 'approved');
            
        console.log('Approved requests:', {
            success: !requestsError,
            error: requestsError,
            count: approvedRequests?.length || 0,
            data: approvedRequests
        });
        
        return {
            directQuery: { success: !directError, count: directData?.length || 0 },
            optimizedFunction: { success: !optimizedError, count: optimizedData?.length || 0 },
            finalFunction: { success: !finalError, count: finalData?.length || 0 },
            approvedRequests: { success: !requestsError, count: approvedRequests?.length || 0 }
        };
    } catch (error) {
        console.error('❌ Debug error:', error);
        return { error: error.message };
    }
}

// Add this to the page for easy debugging
window.debugStudentDashboard = debugStudentDashboard;