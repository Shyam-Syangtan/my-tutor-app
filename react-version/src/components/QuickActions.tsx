import React from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../constants/routes';

const QuickActions: React.FC = () => {
  const actions = [
    {
      title: 'Find Tutors',
      description: 'Browse available tutors',
      icon: 'fas fa-search',
      color: 'bg-blue-500 hover:bg-blue-600',
      route: ROUTES.MARKETPLACE
    },
    {
      title: 'Messages',
      description: 'Chat with your tutors',
      icon: 'fas fa-comments',
      color: 'bg-green-500 hover:bg-green-600',
      route: ROUTES.MESSAGES
    },
    {
      title: 'Profile',
      description: 'Update your profile',
      icon: 'fas fa-user',
      color: 'bg-purple-500 hover:bg-purple-600',
      route: ROUTES.PROFILE
    }
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border">
      <div className="p-6 border-b">
        <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
      </div>
      <div className="p-6">
        <div className="space-y-3">
          {actions.map((action, index) => (
            <Link
              key={index}
              to={action.route}
              className={`block w-full ${action.color} text-white rounded-lg p-4 transition-all duration-200 hover:transform hover:-translate-y-1 hover:shadow-lg`}
            >
              <div className="flex items-center space-x-3">
                <i className={`${action.icon} text-xl`}></i>
                <div>
                  <h4 className="font-medium">{action.title}</h4>
                  <p className="text-sm opacity-90">{action.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuickActions;
