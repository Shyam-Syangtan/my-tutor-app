import React, { useState, useRef, useEffect } from 'react';

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
  onHover?: (tutorId: string) => void;
  onLeave?: (tutorId: string) => void;
  isVideoActive?: boolean;
}

const TutorCard: React.FC<TutorCardProps> = ({
  tutor,
  onContact,
  onViewProfile,
  onHover,
  onLeave,
  isVideoActive = false
}) => {
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const avatarUrl = tutor.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(tutor.name)}&background=6366f1&color=fff&size=80`;

  // Process video URL first (needed for useEffect)
  const isYouTubeVideo = tutor.video_url && (tutor.video_url.includes('youtube.com') || tutor.video_url.includes('youtu.be'));
  const finalVideoUrl = tutor.video_url;
  const hasValidVideo = finalVideoUrl && finalVideoUrl.length > 0;

  // Handle video state when card becomes inactive (sticky behavior)
  useEffect(() => {
    if (!isVideoActive) {
      // Pause and reset video when this card becomes inactive
      if (videoRef.current && !isYouTubeVideo) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
        setVideoPlaying(false);
      }
      // Close YouTube modal if it was open
      if (isYouTubeVideo && videoPlaying) {
        setVideoPlaying(false);
      }
    }
  }, [isVideoActive, isYouTubeVideo, videoPlaying]);

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

  // Helper function to extract YouTube video ID
  const getYouTubeVideoId = (url: string): string | null => {
    if (!url) return null;

    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(youtubeRegex);

    return match ? match[1] : null;
  };

  // Helper function to get YouTube thumbnail
  const getYouTubeThumbnail = (videoId: string): string => {
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  };

  // Helper function to get YouTube embed URL with better parameters
  const getYouTubeEmbedUrl = (videoId: string): string => {
    // Use youtube-nocookie.com for better embedding support
    return `https://www.youtube-nocookie.com/embed/${videoId}?controls=1&rel=0&modestbranding=1&enablejsapi=1&origin=${window.location.origin}`;
  };

  // Process YouTube-specific data
  const youtubeVideoId = isYouTubeVideo && tutor.video_url ? getYouTubeVideoId(tutor.video_url) : null;
  const youtubeThumbnail = youtubeVideoId ? getYouTubeThumbnail(youtubeVideoId) : null;
  const youtubeEmbedUrl = youtubeVideoId ? getYouTubeEmbedUrl(youtubeVideoId) : null;

  // Simple debug logging
  if (tutor.video_url) {
    console.log(`🎬 ${tutor.name} video:`, {
      original: tutor.video_url,
      processed: finalVideoUrl,
      isYouTube: isYouTubeVideo
    });
  }

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent navigation if clicking on buttons or video area
    const target = e.target as HTMLElement;
    if (target.closest('button') ||
        target.closest('.video-container') ||
        target.closest('.tutor-video-space')) {
      return;
    }

    console.log('🖱️ Card clicked - navigating to profile');
    if (onViewProfile) {
      onViewProfile(tutor.id);
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

  // Enhanced hover handlers for sticky video functionality (italki-style)
  const handleMouseEnter = () => {
    // Notify parent about hover - this will make video card sticky
    if (onHover) {
      onHover(tutor.id);
    }

    // Auto-play video on hover (muted for better UX) - only for direct videos
    if (videoRef.current && !isYouTubeVideo && finalVideoUrl && isVideoActive) {
      videoRef.current.muted = true;
      videoRef.current.play().catch(console.error);
    }
  };

  const handleMouseLeave = () => {
    // Notify parent about leave - but video card stays sticky
    if (onLeave) {
      onLeave(tutor.id);
    }

    // Don't pause video immediately - let it continue playing
    // Video will only stop when another tutor is hovered
  };

  // Enhanced video event handlers
  const handleVideoLoad = () => {
    setVideoLoaded(true);
    setVideoError(false);
  };

  const handleVideoError = (error: any) => {
    console.error('Video failed to load:', tutor.video_url, error);
    setVideoError(true);
    setVideoLoaded(false);
  };

  const handleVideoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // For YouTube videos, open in modal overlay (like italki)
    if (isYouTubeVideo) {
      console.log('📺 Opening YouTube video in modal');
      setVideoPlaying(true);
      return;
    }

    // For direct video files, toggle play/pause
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.muted = false;
        videoRef.current.play().then(() => {
          setVideoPlaying(true);
        }).catch(console.error);
      } else {
        videoRef.current.pause();
        setVideoPlaying(false);
      }
    }
  };

  const handleVideoPlay = () => {
    setVideoPlaying(true);
  };

  const handleVideoPause = () => {
    setVideoPlaying(false);
  };



  return (
    <div
      className="tutor-card-container"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Main Tutor Card - Fixed 70% width */}
      <div
        className={`tutor-card ${isVideoActive ? 'hovered' : ''}`}
        onClick={handleCardClick}
        data-has-video={hasValidVideo ? 'true' : 'false'}
      >
        <div className="tutor-card-content">
          {/* Left Section: Avatar & Basic Info */}
          <div className="tutor-left-section">
            <div className="tutor-avatar-container">
              <img
                src={avatarUrl}
                alt={tutor.name}
                className="tutor-avatar"
              />
            </div>

            <div className="tutor-info-section">
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

              {/* Stats Row */}
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

              {/* Pricing */}
              <div className="tutor-pricing">
                <div className="price-amount">₹{tutor.rate}</div>
                <div className="price-label">per lesson</div>
              </div>
            </div>
          </div>

          {/* Right Section: Action Buttons */}
          <div className="tutor-right-section">
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
              <button
                className="action-btn view-schedule-btn"
                onClick={handleViewProfile}
              >
                View full schedule
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reserved Video Card Space - Fixed 30% width */}
      <div className="tutor-video-space">
        {/* Video Card - Sticky visibility based on parent state */}
        <div className={`tutor-video-card ${isVideoActive ? 'visible' : ''}`}>
          <div className="video-container" onClick={handleVideoClick}>
            {hasValidVideo ? (
              <div className="video-thumbnail">
                {isYouTubeVideo ? (
                  // YouTube Video with proper 16:9 aspect ratio
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      aspectRatio: '16/9', // Standard YouTube aspect ratio
                      minHeight: '180px',
                      maxHeight: '216px'
                    }}
                  >
                    {/* YouTube Thumbnail - Click to open modal */}
                    <div
                      className="video-placeholder"
                      onClick={handleVideoClick}
                      style={{
                        position: 'relative',
                        width: '100%',
                        height: '100%',
                        cursor: 'pointer',
                        borderRadius: '8px',
                        overflow: 'hidden'
                      }}
                    >
                      <div className="video-thumbnail" style={{
                        width: '100%',
                        height: '100%',
                        position: 'relative',
                        overflow: 'hidden',
                        borderRadius: '8px'
                      }}>
                        {youtubeThumbnail ? (
                          <img
                            src={youtubeThumbnail}
                            alt={`${tutor.name} video`}
                            className="video-poster"
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              position: 'absolute',
                              top: 0,
                              left: 0
                            }}
                            onLoad={() => setVideoLoaded(true)}
                            onError={() => {
                              console.log('Thumbnail failed, using avatar');
                              setVideoError(true);
                            }}
                          />
                        ) : (
                          <img
                            src={avatarUrl}
                            alt={tutor.name}
                            className="video-poster"
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              position: 'absolute',
                              top: 0,
                              left: 0
                            }}
                          />
                        )}

                        {/* YouTube Play Button */}
                        <div
                          className="video-play-overlay"
                          style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: '68px',
                            height: '48px',
                            backgroundColor: 'rgba(255, 0, 0, 0.9)',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.3s ease'
                          }}
                        >
                          <div style={{
                            width: 0,
                            height: 0,
                            borderLeft: '16px solid white',
                            borderTop: '10px solid transparent',
                            borderBottom: '10px solid transparent',
                            marginLeft: '4px'
                          }} />
                        </div>

                        {/* YouTube Badge */}
                        <div
                          style={{
                            position: 'absolute',
                            bottom: '8px',
                            right: '8px',
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            color: 'white',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: 'bold'
                          }}
                        >
                          YouTube
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Direct Video File Handling with Controls
                  <>
                    <video
                      ref={videoRef}
                      src={finalVideoUrl}
                      controls={videoPlaying} // Show controls when playing
                      muted={!videoPlaying} // Muted on hover, unmuted when clicked
                      loop={false}
                      playsInline
                      preload="metadata"
                      onLoadedData={handleVideoLoad}
                      onError={handleVideoError}
                      onPlay={handleVideoPlay}
                      onPause={handleVideoPause}
                      className="video-preview"
                      poster={avatarUrl}
                      style={{
                        objectFit: 'cover',
                        width: '100%',
                        height: '100%',
                        aspectRatio: '16/9',
                        borderRadius: '8px',
                        pointerEvents: videoPlaying ? 'auto' : 'none' // Allow controls when playing
                      }}
                      onClick={(e) => {
                        if (videoPlaying) {
                          e.stopPropagation(); // Let video controls handle clicks when playing
                        }
                      }}
                    />

                    {/* Play overlay when video is not playing */}
                    {!videoPlaying && videoLoaded && !videoError && (
                      <div className="video-play-overlay">
                        <svg className="play-icon" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M8 5v10l8-5-8-5z"/>
                        </svg>
                      </div>
                    )}
                  </>
                )}

                {/* Loading spinner */}
                {!videoLoaded && !videoError && (
                  <div className="video-loading">
                    <div className="loading-spinner"></div>
                    <p className="loading-text">Loading video...</p>
                  </div>
                )}

                {/* Error state */}
                {videoError && (
                  <div className="video-error">
                    <svg className="error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <p className="error-text">Video unavailable</p>
                  </div>
                )}
              </div>
            ) : (
              // No video available
              <div className="video-placeholder">
                <div className="placeholder-content">
                  <svg className="video-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 002 2z"/>
                  </svg>
                  <p className="placeholder-text">No video available</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Video Modal Overlay - Like italki */}
      {hasValidVideo && videoPlaying && isYouTubeVideo && (
        <div
          className="video-modal-overlay"
          style={{
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setVideoPlaying(false);
            }
          }}
        >
          <div
            className="video-modal-content"
            style={{
              width: '90%',
              maxWidth: '800px',
              height: '90%',
              maxHeight: '600px',
              backgroundColor: 'white',
              borderRadius: '12px',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {/* Close button */}
            <button
              onClick={() => setVideoPlaying(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                zIndex: 10,
              }}
            >
              ×
            </button>

            {/* YouTube Video */}
            <iframe
              src={`${youtubeEmbedUrl}&autoplay=1`}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
              }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={`${tutor.name} introduction video`}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TutorCard;
