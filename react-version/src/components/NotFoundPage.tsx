import React from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../constants/routes';

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-xl shadow-sm border p-8">
          <div className="mb-6">
            <i className="fas fa-exclamation-triangle text-6xl text-yellow-500 mb-4"></i>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">404</h1>
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Page Not Found</h2>
            <p className="text-gray-600 mb-6">
              The page you're looking for doesn't exist in the React version of the app.
            </p>
          </div>

          <div className="space-y-3">
            <Link 
              to={ROUTES.LANDING}
              className="block w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Go to Home
            </Link>
            <Link 
              to={ROUTES.DASHBOARD}
              className="block w-full bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Go to Dashboard
            </Link>
            <Link 
              to={ROUTES.MARKETPLACE}
              className="block w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Find Tutors
            </Link>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Looking for the original HTML version?{' '}
              <a 
                href="https://shyamsyangtan.com" 
                className="text-blue-600 hover:text-blue-700 font-medium"
                target="_blank"
                rel="noopener noreferrer"
              >
                Visit the main site
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
