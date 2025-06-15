import React from 'react';

interface Tutor {
  id: string;
  name: string;
  email: string;
  profile_picture?: string;
  role: string;
}

interface Availability {
  id: string;
  tutor_id: string;
  lesson_date: string;
  start_time: string;
  end_time: string;
  is_booked: boolean;
  tutor?: Tutor;
}

interface AvailableTutorsProps {
  tutors: Tutor[];
  availability: Availability[];
  onBookingClick: (availability: Availability) => void;
}

const AvailableTutors: React.FC<AvailableTutorsProps> = ({ 
  tutors, 
  availability, 
  onBookingClick 
}) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getTutorAvailability = (tutorId: string) => {
    return availability.filter(a => a.tutor_id === tutorId);
  };

  if (tutors.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Available Tutors</h2>
        </div>
        <div className="p-6">
          <div className="text-center py-8">
            <i className="fas fa-user-graduate text-4xl text-gray-300 mb-4"></i>
            <p className="text-gray-500">No tutors available at the moment</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border">
      <div className="p-6 border-b">
        <h2 className="text-lg font-semibold text-gray-900">Available Tutors</h2>
      </div>
      <div className="p-6">
        {tutors.map(tutor => {
          const tutorAvailability = getTutorAvailability(tutor.id);
          const avatarUrl = tutor.profile_picture || 
            `https://ui-avatars.com/api/?name=${encodeURIComponent(tutor.name || tutor.email)}&background=3b82f6&color=fff`;

          return (
            <div key={tutor.id} className="tutor-card bg-gray-50 rounded-lg p-6 mb-4 border">
              <div className="flex items-start space-x-4">
                <img 
                  src={avatarUrl}
                  alt={tutor.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {tutor.name || tutor.email}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">{tutor.email}</p>
                  
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Available Times:</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {tutorAvailability.slice(0, 6).map(slot => (
                        <button 
                          key={slot.id}
                          onClick={() => onBookingClick(slot)}
                          className="available-slot px-3 py-2 rounded-lg text-xs font-medium bg-green-500 hover:bg-green-600 text-white transition-all duration-200 hover:transform hover:-translate-y-1"
                        >
                          {formatDate(slot.lesson_date)} {formatTime(slot.start_time)}
                        </button>
                      ))}
                      {tutorAvailability.length > 6 && (
                        <div className="text-xs text-gray-500 flex items-center justify-center">
                          +{tutorAvailability.length - 6} more
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AvailableTutors;
