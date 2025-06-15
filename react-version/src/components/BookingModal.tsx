import React, { useState } from 'react';

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

interface BookingModalProps {
  availability: Availability;
  onSubmit: (lessonType: string, notes: string) => void;
  onClose: () => void;
}

const BookingModal: React.FC<BookingModalProps> = ({ 
  availability, 
  onSubmit, 
  onClose 
}) => {
  const [lessonType, setLessonType] = useState('conversation_practice');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric',
      month: 'long', 
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await onSubmit(lessonType, notes);
    } catch (error) {
      console.error('Booking error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const tutorName = availability.tutor?.name || 'Tutor';
  const tutorEmail = availability.tutor?.email || '';
  const avatarUrl = availability.tutor?.profile_picture || 
    `https://ui-avatars.com/api/?name=${encodeURIComponent(tutorName)}&background=3b82f6&color=fff`;

  const lessonTypes = [
    { value: 'conversation_practice', label: 'Conversation Practice', price: 500 },
    { value: 'grammar_lesson', label: 'Grammar Lesson', price: 600 },
    { value: 'pronunciation', label: 'Pronunciation', price: 550 },
    { value: 'trial', label: 'Trial Lesson', price: 300 }
  ];

  const selectedLessonType = lessonTypes.find(type => type.value === lessonType);

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Book a Lesson</h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Tutor Info */}
          <div className="flex items-center space-x-4 mb-6">
            <img 
              src={avatarUrl}
              alt={tutorName}
              className="w-16 h-16 rounded-full object-cover"
            />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{tutorName}</h3>
              <p className="text-sm text-gray-600">{tutorEmail}</p>
            </div>
          </div>

          {/* Time Slot Info */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-blue-900 mb-2">Selected Time Slot</h4>
            <p className="text-blue-800">
              <i className="fas fa-calendar mr-2"></i>
              {formatDate(availability.lesson_date)}
            </p>
            <p className="text-blue-800">
              <i className="fas fa-clock mr-2"></i>
              {formatTime(availability.start_time)} - {formatTime(availability.end_time)}
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Lesson Type */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Lesson Type
              </label>
              <div className="space-y-2">
                {lessonTypes.map(type => (
                  <label key={type.value} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="lessonType"
                      value={type.value}
                      checked={lessonType === type.value}
                      onChange={(e) => setLessonType(e.target.value)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="flex-1 text-sm text-gray-700">{type.label}</span>
                    <span className="text-sm font-medium text-gray-900">₹{type.price}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Any specific topics or goals for this lesson?"
              />
            </div>

            {/* Price Summary */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-900">Total Price:</span>
                <span className="text-xl font-bold text-green-600">
                  ₹{selectedLessonType?.price || 500}
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              {isSubmitting ? 'Booking...' : 'Book Lesson'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
