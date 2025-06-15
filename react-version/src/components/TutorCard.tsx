import React from 'react';

interface Tutor {
  id: string;
  user_id: string;
  name: string;
  bio?: string;
  bio_headline?: string;
  rate: number;
  rating: number;
  photo_url?: string;
  native_language?: string;
  language?: string;
  languages_spoken?: any;
  tags?: any;
  country_flag?: string;
  total_students?: number;
  total_lessons?: number;
  is_professional?: boolean;
  video_url?: string;
}

interface TutorCardProps {
  tutor: Tutor;
  onContact: (tutorUserId: string, tutorName: string) => void;
}

const TutorCard: React.FC<TutorCardProps> = ({ tutor, onContact }) => {
  const avatarUrl = tutor.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(tutor.name)}&background=6366f1&color=fff&size=80`;
  
  const languages = tutor.languages_spoken && tutor.languages_spoken.length > 0 ?
    (typeof tutor.languages_spoken === 'string' ? JSON.parse(tutor.languages_spoken) : tutor.languages_spoken) :
    [{ language: tutor.native_language || tutor.language, proficiency: 'Native' }];
  
  const tags = tutor.tags && tutor.tags.length > 0 ?
    (typeof tutor.tags === 'string' ? JSON.parse(tutor.tags) : tutor.tags) :
    ['Conversational', 'Grammar'];
  
  const countryFlag = tutor.country_flag || '🇮🇳';
  const totalStudents = tutor.total_students || Math.floor(Math.random() * 50 + 10);
  const totalLessons = tutor.total_lessons || Math.floor(Math.random() * 200 + 50);
  const isProfessional = tutor.is_professional || false;
  const rating = tutor.rating || 4.5;
  const ratingStars = '⭐'.repeat(Math.floor(rating));

  const handleCardClick = (e: React.MouseEvent) => {
    if (!(e.target as HTMLElement).closest('button')) {
      window.open(`/my-tutor-app/react-version/profile?id=${tutor.id}`, '_blank');
    }
  };

  const handleContact = (e: React.MouseEvent) => {
    e.stopPropagation();
    onContact(tutor.user_id, tutor.name);
  };

  const handleBookLesson = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`/my-tutor-app/react-version/profile?id=${tutor.id}`, '_blank');
  };

  const handleViewProfile = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`/my-tutor-app/react-version/profile?id=${tutor.id}`, '_blank');
  };

  return (
    <div 
      className="tutor-card"
      onClick={handleCardClick}
    >
      <div className="tutor-card-content">
        {/* Horizontal Layout */}
        <div className="tutor-card-layout">
          {/* Left: Avatar and Video Thumbnail */}
          <div className="tutor-avatar-section">
            <div className="tutor-avatar-container">
              <img 
                src={avatarUrl} 
                alt={tutor.name} 
                className="tutor-avatar"
              />
              {tutor.video_url && (
                <div className="video-indicator">
                  <svg className="video-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8 5v10l8-5-8-5z"/>
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* Right: Content */}
          <div className="tutor-content">
            {/* Header */}
            <div className="tutor-header">
              <div className="tutor-info">
                <div className="tutor-name-row">
                  <h3 className="tutor-name">{tutor.name}</h3>
                  <span className="country-flag">{countryFlag}</span>
                  {isProfessional && (
                    <span className="professional-badge">Professional</span>
                  )}
                </div>
                <p className="tutor-headline">
                  {tutor.bio_headline || `${tutor.native_language || tutor.language} Teacher`}
                </p>
              </div>
              <div className="tutor-pricing">
                <div className="price-amount">₹{tutor.rate}</div>
                <div className="price-label">per lesson</div>
              </div>
            </div>

            {/* Language Badges */}
            <div className="language-badges">
              <span className="language-badge primary">
                {tutor.native_language || tutor.language}
              </span>
              {languages.slice(0, 2).map((lang: any, index: number) => (
                <span key={index} className={`language-badge secondary-${index + 1}`}>
                  {lang.language}
                </span>
              ))}
              {languages.length > 2 && (
                <span className="language-badge more">+{languages.length - 2}</span>
              )}
            </div>

            {/* Stats */}
            <div className="tutor-stats">
              <div className="stat-item">
                <span className="rating-stars">{ratingStars}</span>
                <span className="rating-value">{rating.toFixed(1)}</span>
              </div>
              <div className="stat-item">
                <svg className="stat-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
                </svg>
                <span>{totalStudents} students</span>
              </div>
              <div className="stat-item">
                <svg className="stat-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                </svg>
                <span>{totalLessons} lessons</span>
              </div>
            </div>

            {/* Tags */}
            {tags.length > 0 && (
              <div className="tutor-tags">
                {tags.slice(0, 2).map((tag: string, index: number) => (
                  <span key={index} className={`tag tag-${index + 1}`}>
                    {tag}
                  </span>
                ))}
                {tags.length > 2 && (
                  <span className="tag tag-more">+{tags.length - 2}</span>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="tutor-actions">
              <button 
                className="action-btn contact-btn"
                onClick={handleContact}
              >
                Contact
              </button>
              <button 
                className="action-btn book-btn"
                onClick={handleBookLesson}
              >
                Book Lesson
              </button>
              <button 
                className="action-btn profile-btn"
                onClick={handleViewProfile}
              >
                Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorCard;
