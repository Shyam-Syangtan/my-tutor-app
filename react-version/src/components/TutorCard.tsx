import React, { useState, useRef } from 'react';

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
  onViewProfile?: (tutorId: string) => void;
}

const TutorCard: React.FC<TutorCardProps> = ({ tutor, onContact, onViewProfile }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Debug video data
  console.log(`🎬 TutorCard for ${tutor.name}:`, {
    hasVideoUrl: !!tutor.video_url,
    videoUrl: tutor.video_url,
    tutorId: tutor.id
  });

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
      if (onViewProfile) {
        onViewProfile(tutor.id);
      }
    }
  };

  const handleContact = (e: React.MouseEvent) => {
    e.stopPropagation();
    onContact(tutor.user_id, tutor.name);
  };

  const handleBookLesson = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onViewProfile) {
      onViewProfile(tutor.id);
    }
  };

  const handleViewProfile = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onViewProfile) {
      onViewProfile(tutor.id);
    }
  };

  // Video handling functions
  const handleMouseEnter = () => {
    console.log(`🖱️ Mouse enter on ${tutor.name}:`, {
      hasHoverSupport: window.matchMedia('(hover: hover)').matches,
      hasVideoUrl: !!tutor.video_url,
      hasVideoRef: !!videoRef.current,
      videoUrl: tutor.video_url
    });

    // Only enable video preview on non-touch devices (desktop/tablet)
    if (window.matchMedia('(hover: hover)').matches) {
      setIsHovered(true);
      if (tutor.video_url && videoRef.current) {
        console.log(`▶️ Attempting to play video for ${tutor.name}`);
        videoRef.current.play()
          .then(() => console.log(`✅ Video playing for ${tutor.name}`))
          .catch(error => console.error(`❌ Video play failed for ${tutor.name}:`, error));
      } else {
        console.log(`⚠️ Cannot play video for ${tutor.name}:`, {
          noVideoUrl: !tutor.video_url,
          noVideoRef: !videoRef.current
        });
      }
    }
  };

  const handleMouseLeave = () => {
    console.log(`🖱️ Mouse leave on ${tutor.name}`);
    setIsHovered(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      console.log(`⏹️ Video stopped for ${tutor.name}`);
    }
  };

  const handleVideoLoad = () => {
    console.log(`📹 Video loaded for ${tutor.name}`);
    setVideoLoaded(true);
  };

  const handleVideoError = (error: any) => {
    console.error(`❌ Video failed to load for ${tutor.name}:`, error);
    console.error('Video URL:', tutor.video_url);
  };

  return (
    <div
      className={`tutor-card ${isHovered ? 'hovered' : ''}`}
      onClick={handleCardClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Side-by-Side Layout: 70% Card + 30% Video */}
        <div className="tutor-row-layout">
          {/* Left 70%: Tutor Card */}
          <div className="tutor-card-section">
            <div className="tutor-card-content">
              {/* Avatar & Basic Info */}
              <div className="tutor-left-info">
                <div className="tutor-avatar-container">
                  <img
                    src={avatarUrl}
                    alt={tutor.name}
                    className="tutor-avatar"
                  />
                </div>

                <div className="tutor-basic-info">
                  <div className="tutor-name-row">
                    <h3 className="tutor-name">{tutor.name}</h3>
                    <span className="country-flag">{countryFlag}</span>
                    {isProfessional && (
                      <span className="professional-badge">Professional</span>
                    )}
                  </div>
                  <p className="tutor-subtitle">
                    {tutor.bio_headline || `${tutor.native_language || tutor.language} Teacher`}
                  </p>

                  {/* Language Badges */}
                  <div className="language-badges">
                    <span className="language-badge primary">
                      {tutor.native_language || tutor.language}
                    </span>
                    {languages.slice(0, 1).map((lang: any, index: number) => (
                      <span key={index} className="language-badge secondary">
                        {lang.language}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Stats & Details */}
              <div className="tutor-details">
                <div className="tutor-stats-row">
                  <div className="stat-item rating">
                    <span className="rating-stars">{ratingStars}</span>
                    <span className="rating-value">{rating.toFixed(1)}</span>
                  </div>
                  <div className="stat-item students">
                    <svg className="stat-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
                    </svg>
                    <span>{totalStudents} students</span>
                  </div>
                  <div className="stat-item lessons">
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
                  </div>
                )}

                {/* Price & Actions */}
                <div className="tutor-bottom-section">
                  <div className="tutor-pricing">
                    <div className="price-amount">₹{tutor.rate}</div>
                    <div className="price-label">per lesson</div>
                  </div>

                  <div className="tutor-actions">
                    <button
                      className="action-btn contact-btn"
                      onClick={handleContact}
                    >
                      Send message
                    </button>
                    <button
                      className="action-btn book-btn"
                      onClick={handleBookLesson}
                    >
                      Book trial lesson
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right 30%: Video Section */}
          <div className="tutor-video-section">
            {/* Debug info - temporary */}
            <div style={{fontSize: '10px', color: 'red', marginBottom: '5px'}}>
              Video: {tutor.video_url ? 'YES' : 'NO'} | Loaded: {videoLoaded ? 'YES' : 'NO'} | Hovered: {isHovered ? 'YES' : 'NO'}
            </div>

            {tutor.video_url ? (
              <div className="video-container">
                <div className="video-thumbnail" onClick={handleViewProfile}>
                  <video
                    ref={videoRef}
                    src={tutor.video_url}
                    muted={true}
                    loop={true}
                    playsInline={true}
                    preload="metadata"
                    onLoadedData={handleVideoLoad}
                    onError={(e) => handleVideoError(e)}
                    onCanPlay={() => console.log(`📹 Video can play for ${tutor.name}`)}
                    onLoadStart={() => console.log(`🔄 Video load started for ${tutor.name}`)}
                    className="video-preview"
                    poster={avatarUrl}
                    controls={false}
                  />
                  <div className="video-play-overlay">
                    <svg className="play-icon" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8 5v10l8-5-8-5z"/>
                    </svg>
                  </div>
                  {!videoLoaded && (
                    <div className="video-loading">
                      <div className="loading-spinner"></div>
                    </div>
                  )}
                </div>
                <button
                  className="video-action-btn"
                  onClick={handleViewProfile}
                >
                  View full schedule
                </button>
                {/* Debug: Show video URL */}
                <div style={{fontSize: '8px', color: 'blue', wordBreak: 'break-all'}}>
                  {tutor.video_url}
                </div>
              </div>
            ) : (
              <div className="video-placeholder">
                <img src={avatarUrl} alt={tutor.name} className="placeholder-image" />
                <button
                  className="video-action-btn"
                  onClick={handleViewProfile}
                >
                  View Profile
                </button>
              </div>
            )}
          </div>
        </div>
    </div>
  );
};

export default TutorCard;
