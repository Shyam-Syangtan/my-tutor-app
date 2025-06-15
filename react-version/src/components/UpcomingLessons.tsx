import React from 'react';

interface Lesson {
  id: string;
  tutor_id: string;
  lesson_date: string;
  start_time: string;
  lesson_type: string;
  price: number;
  status: string;
  tutor_name?: string;
}

interface UpcomingLessonsProps {
  lessons: Lesson[];
}

const UpcomingLessons: React.FC<UpcomingLessonsProps> = ({ lessons }) => {
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

  const getUpcomingLessons = () => {
    const now = new Date();
    return lessons.filter(lesson => {
      if (!lesson.lesson_date || !lesson.start_time) return false;
      try {
        const lessonDateTime = new Date(lesson.lesson_date + 'T' + lesson.start_time);
        return lessonDateTime > now && lesson.status === 'confirmed';
      } catch (error) {
        console.warn('Invalid lesson date/time:', lesson);
        return false;
      }
    });
  };

  const upcomingLessons = getUpcomingLessons();

  return (
    <div className="bg-white rounded-xl shadow-sm border">
      <div className="p-6 border-b">
        <h3 className="text-lg font-semibold text-gray-900">My Lessons</h3>
      </div>
      <div className="p-6 max-h-96 overflow-y-auto">
        {upcomingLessons.length === 0 ? (
          <div className="text-center py-8">
            <i className="fas fa-calendar-alt text-3xl text-gray-300 mb-3"></i>
            <p className="text-gray-500 text-sm">No upcoming lessons</p>
            <p className="text-xs text-gray-400 mt-2">Approved lessons will appear here automatically</p>
            <p className="text-xs text-gray-400 mt-1">Total lessons found: {lessons.length}</p>
          </div>
        ) : (
          upcomingLessons.map(lesson => {
            const tutorName = lesson.tutor_name || 'Tutor';
            const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(tutorName)}&background=ffffff&color=3b82f6`;

            return (
              <div key={lesson.id} className="booked-lesson rounded-lg p-4 mb-3 border-l-4 border-green-500 bg-gradient-to-r from-green-50 to-green-100">
                <div className="flex items-center space-x-3">
                  <img 
                    src={avatarUrl}
                    alt={tutorName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium text-sm text-gray-900">{tutorName}</h4>
                    <p className="text-xs text-gray-600">
                      {formatDate(lesson.lesson_date)} at {formatTime(lesson.start_time)}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {lesson.lesson_type || 'conversation_practice'} lesson - ₹{lesson.price || 500}
                      <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                        {lesson.status || 'confirmed'}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default UpcomingLessons;
