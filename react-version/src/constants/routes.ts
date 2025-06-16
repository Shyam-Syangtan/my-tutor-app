// React App Routes - All navigation should use these constants
export const ROUTES = {
  // Main pages
  LANDING: '/',
  HOME: '/home',
  DASHBOARD: '/dashboard', // Alias for home
  MARKETPLACE: '/marketplace',
  STUDENT_DASHBOARD: '/student-dashboard', // Advanced dashboard
  MESSAGES: '/messages',
  PROFILE: '/profile',

  // Tutor-related routes
  BECOME_TUTOR_INFO: '/become-tutor-info',
  TUTOR_DASHBOARD: '/tutor-dashboard',

  // External links (if needed)
  EXTERNAL: {
    ORIGINAL_SITE: 'https://shyam-syangtan.github.io/my-tutor-app',
    TUTOR_DASHBOARD: '/my-tutor-app/tutor-dashboard.html' // Only if needed
  }
} as const;

// Helper function to get full URL for React routes
export const getReactRoute = (route: string): string => {
  const baseUrl = '';
  return route === '/' ? baseUrl : `${baseUrl}${route}`;
};

// Navigation items for consistent use across components
export const NAV_ITEMS = [
  { label: 'Dashboard', route: ROUTES.DASHBOARD },
  { label: 'Find Tutors', route: ROUTES.MARKETPLACE },
  { label: 'Messages', route: ROUTES.MESSAGES },
  { label: 'Profile', route: ROUTES.PROFILE }
] as const;
