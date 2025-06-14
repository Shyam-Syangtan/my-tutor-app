// BYPASS USERS TABLE - Alternative approach to avoid 406 errors
// This completely avoids the problematic users table

class UserNameBypass {
    constructor(supabase) {
        this.supabase = supabase;
        this.cache = new Map();
    }

    async resolveUserName(userId) {
        // Check cache first
        if (this.cache.has(userId)) {
            return this.cache.get(userId);
        }

        let userName = 'User';

        // Strategy 1: Try tutors table (most likely to have data)
        try {
            const { data: tutorData, error } = await this.supabase
                .from('tutors')
                .select('name, email')
                .eq('user_id', userId)
                .single();

            if (!error && tutorData) {
                userName = tutorData.name || tutorData.email?.split('@')[0] || 'Tutor';
                console.log(`✅ [BYPASS] Tutors table resolved: ${userName}`);
                this.cache.set(userId, userName);
                return userName;
            }
        } catch (error) {
            console.warn(`⚠️ [BYPASS] Tutors table failed:`, error.message);
        }

        // Strategy 2: Try students table
        try {
            const { data: studentData, error } = await this.supabase
                .from('students')
                .select('name, email')
                .eq('user_id', userId)
                .single();

            if (!error && studentData) {
                userName = studentData.name || studentData.email?.split('@')[0] || 'Student';
                console.log(`✅ [BYPASS] Students table resolved: ${userName}`);
                this.cache.set(userId, userName);
                return userName;
            }
        } catch (error) {
            console.warn(`⚠️ [BYPASS] Students table failed:`, error.message);
        }

        // Strategy 3: Generate a friendly name from UUID
        const friendlyName = `User${userId.substring(0, 4)}`;
        console.log(`✅ [BYPASS] Generated friendly name: ${friendlyName}`);
        this.cache.set(userId, friendlyName);
        return friendlyName;
    }

    async resolveMultipleUserNames(userIds) {
        const results = {};
        
        // Process in batches to avoid overwhelming the database
        const batchSize = 10;
        for (let i = 0; i < userIds.length; i += batchSize) {
            const batch = userIds.slice(i, i + batchSize);
            const promises = batch.map(userId => 
                this.resolveUserName(userId).then(name => ({ userId, name }))
            );
            
            const batchResults = await Promise.all(promises);
            batchResults.forEach(({ userId, name }) => {
                results[userId] = name;
            });
        }
        
        return results;
    }

    clearCache() {
        this.cache.clear();
    }
}

// Export for use in other files
if (typeof window !== 'undefined') {
    window.UserNameBypass = UserNameBypass;
}

// Usage example:
/*
const bypass = new UserNameBypass(supabase);
const userName = await bypass.resolveUserName('f279fba8-d1d3-4b53-8b50-40cabdb74738');
console.log('Resolved name:', userName);
*/
