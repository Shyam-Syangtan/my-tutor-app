/**
 * User Name Resolver - Stable solution for resolving user names
 * Addresses the root cause of "Unknown Student/Tutor" issue
 */

class UserNameResolver {
    constructor(supabase, authHandler) {
        this.supabase = supabase;
        this.authHandler = authHandler;
        this.userCache = new Map();
        this.pendingRequests = new Map(); // Prevent duplicate requests
    }

    /**
     * Get user name with caching and fallback mechanisms
     * @param {string} userId - User UUID
     * @param {string} role - 'student' or 'tutor' (optional, for optimization)
     * @returns {Promise<string>} User display name
     */
    async getUserName(userId, role = null) {
        if (!userId) return 'Unknown User';

        // Check cache first
        if (this.userCache.has(userId)) {
            return this.userCache.get(userId);
        }

        // Check if request is already pending
        if (this.pendingRequests.has(userId)) {
            return await this.pendingRequests.get(userId);
        }

        // Create pending request
        const requestPromise = this._resolveUserName(userId, role);
        this.pendingRequests.set(userId, requestPromise);

        try {
            const userName = await requestPromise;
            this.userCache.set(userId, userName);
            return userName;
        } finally {
            this.pendingRequests.delete(userId);
        }
    }

    /**
     * Internal method to resolve user name using multiple strategies
     */
    async _resolveUserName(userId, role) {
        let userName = 'Unknown User';

        // Strategy 1: If it's the current user, use profile data
        const currentUser = this.authHandler.getCurrentUser();
        if (currentUser && userId === currentUser.id) {
            const profile = this.authHandler.getUserProfile();
            if (profile) {
                userName = profile.name || 
                          profile.full_name || 
                          (profile.email ? profile.email.split('@')[0] : 'User');
                console.log(`✅ [RESOLVER] Current user resolved: ${userName}`);
                return userName;
            }
        }

        // Strategy 2: Try users table lookup
        try {
            const { data: userData, error } = await this.supabase
                .from('users')
                .select('email')
                .eq('id', userId)
                .single();

            if (!error && userData?.email) {
                userName = userData.email.split('@')[0];
                console.log(`✅ [RESOLVER] Users table resolved: ${userName} for ${userId.substring(0, 8)}...`);
                return userName;
            } else {
                console.warn(`⚠️ [RESOLVER] Users table lookup failed for ${userId.substring(0, 8)}...:`, error?.message);
            }
        } catch (error) {
            console.warn(`⚠️ [RESOLVER] Users table query exception:`, error.message);
        }

        // Strategy 3: Try tutors table if role is tutor
        if (role === 'tutor') {
            try {
                const { data: tutorData, error } = await this.supabase
                    .from('tutors')
                    .select('name, email')
                    .eq('user_id', userId)
                    .single();

                if (!error && tutorData) {
                    userName = tutorData.name || 
                              (tutorData.email ? tutorData.email.split('@')[0] : 'Tutor');
                    console.log(`✅ [RESOLVER] Tutors table resolved: ${userName}`);
                    return userName;
                }
            } catch (error) {
                console.warn(`⚠️ [RESOLVER] Tutors table lookup failed:`, error.message);
            }
        }

        // Strategy 4: Generate a friendly fallback name
        const fallbackName = role === 'tutor' ? 'Tutor' : 
                            role === 'student' ? 'Student' : 
                            'User';
        
        console.log(`ℹ️ [RESOLVER] Using fallback name: ${fallbackName} for ${userId.substring(0, 8)}...`);
        return fallbackName;
    }

    /**
     * Batch resolve multiple user names efficiently
     * @param {Array} userIds - Array of user IDs
     * @param {string} role - Optional role for optimization
     * @returns {Promise<Map>} Map of userId -> userName
     */
    async batchGetUserNames(userIds, role = null) {
        const uniqueIds = [...new Set(userIds)].filter(id => id);
        const results = new Map();

        // Get cached results first
        const uncachedIds = [];
        for (const id of uniqueIds) {
            if (this.userCache.has(id)) {
                results.set(id, this.userCache.get(id));
            } else {
                uncachedIds.push(id);
            }
        }

        // Batch query for uncached IDs
        if (uncachedIds.length > 0) {
            try {
                const { data: usersData, error } = await this.supabase
                    .from('users')
                    .select('id, email')
                    .in('id', uncachedIds);

                if (!error && usersData) {
                    for (const userData of usersData) {
                        const userName = userData.email ? userData.email.split('@')[0] : 'User';
                        results.set(userData.id, userName);
                        this.userCache.set(userData.id, userName);
                    }
                }

                // Handle any IDs that weren't found
                for (const id of uncachedIds) {
                    if (!results.has(id)) {
                        const fallbackName = role === 'tutor' ? 'Tutor' : 
                                           role === 'student' ? 'Student' : 'User';
                        results.set(id, fallbackName);
                        this.userCache.set(id, fallbackName);
                    }
                }
            } catch (error) {
                console.warn('⚠️ [RESOLVER] Batch query failed:', error.message);
                
                // Fallback for all uncached IDs
                for (const id of uncachedIds) {
                    const fallbackName = role === 'tutor' ? 'Tutor' : 
                                       role === 'student' ? 'Student' : 'User';
                    results.set(id, fallbackName);
                    this.userCache.set(id, fallbackName);
                }
            }
        }

        return results;
    }

    /**
     * Clear cache (useful for testing or when user data changes)
     */
    clearCache() {
        this.userCache.clear();
        this.pendingRequests.clear();
        console.log('🧹 [RESOLVER] Cache cleared');
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            cacheSize: this.userCache.size,
            pendingRequests: this.pendingRequests.size,
            cachedUsers: Array.from(this.userCache.entries()).map(([id, name]) => ({
                id: id.substring(0, 8) + '...',
                name
            }))
        };
    }
}

// Export for use in other modules
window.UserNameResolver = UserNameResolver;
