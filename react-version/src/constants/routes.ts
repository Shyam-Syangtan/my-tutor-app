// React App Routes - All navigation should use these constants
export const ROUTES = {
  // Main pages
  LANDING: '/',
  DASHBOARD: '/dashboard',
  HOME: '/home', // Alias for dashboard
  MARKETPLACE: '/marketplace',
  MESSAGES: '/messages',
  PROFILE: '/profile',
  
  // External links (original HTML site)
  EXTERNAL: {
    ORIGINAL_SITE: 'https://shyamsyangtan.com',
    TUTOR_DASHBOARD: '/my-tutor-app/tutor-dashboard.html' // Only if needed
  }
} as const;

// Helper function to get full URL for React routes
export const getReactRoute = (route: string): string => {
  const baseUrl = '/my-tutor-app/react-version';
  return route === '/' ? baseUrl : `${baseUrl}${route}`;
};

// Navigation items for consistent use across components
export const NAV_ITEMS = [
  { label: 'Dashboard', route: ROUTES.DASHBOARD },
  { label: 'Find Tutors', route: ROUTES.MARKETPLACE },
  { label: 'Messages', route: ROUTES.MESSAGES },
  { label: 'Profile', route: ROUTES.PROFILE }
] as const;
