import React from 'react';

interface Lesson {
  id: string;
  lesson_date: string;
  start_time: string;
  status: string;
}

interface Availability {
  id: string;
}

interface Tutor {
  id: string;
}

interface DashboardStatsProps {
  lessons: Lesson[];
  availability: Availability[];
  tutors: Tutor[];
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ 
  lessons, 
  availability, 
  tutors 
}) => {
  const getUpcomingLessonsCount = () => {
    const now = new Date();
    return lessons.filter(lesson => {
      if (!lesson.lesson_date || !lesson.start_time) return false;
      try {
        const lessonDateTime = new Date(lesson.lesson_date + 'T' + lesson.start_time);
        return lessonDateTime > now && lesson.status === 'confirmed';
      } catch (error) {
        return false;
      }
    }).length;
  };

  const getCompletedLessonsCount = () => {
    return lessons.filter(lesson => lesson.status === 'completed').length;
  };

  const stats = [
    {
      title: 'Upcoming Lessons',
      value: getUpcomingLessonsCount(),
      icon: 'fas fa-calendar-check',
      bgColor: 'bg-green-100',
      iconColor: 'text-green-600'
    },
    {
      title: 'Available Slots',
      value: availability.length,
      icon: 'fas fa-clock',
      bgColor: 'bg-green-100',
      iconColor: 'text-green-600'
    },
    {
      title: 'Total Tutors',
      value: tutors.length,
      icon: 'fas fa-users',
      bgColor: 'bg-purple-100',
      iconColor: 'text-purple-600'
    },
    {
      title: 'Completed',
      value: getCompletedLessonsCount(),
      icon: 'fas fa-graduation-cap',
      bgColor: 'bg-yellow-100',
      iconColor: 'text-yellow-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <div key={index} className="bg-white rounded-xl shadow-sm p-6 border">
          <div className="flex items-center">
            <div className={`p-2 ${stat.bgColor} rounded-lg`}>
              <i className={`${stat.icon} ${stat.iconColor}`}></i>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{stat.title}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DashboardStats;
