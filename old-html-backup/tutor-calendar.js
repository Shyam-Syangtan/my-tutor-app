/**
 * Tutor Calendar Management System
 * Handles availability setting and lesson scheduling
 */

// Supabase Configuration
const SUPABASE_URL = 'https://qbyyutebrgpxngvwenkd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFieXl1dGVicmdweG5ndndlbmtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3MTA1NTMsImV4cCI6MjA2NTI4NjU1M30.eO8Wd0ZOqtXgvQ3BuedmSPmYVpbG3V-AXvgufLns6yY';

let supabase;
let currentUser;
let currentWeekStart;
let availabilityData = {};
let lessonsData = {};

// Time slots (Full 24-hour format: 1:00 AM - 12:00 AM / 24:00 in 30-minute intervals)
const TIME_SLOTS = [];

// Generate 30-minute intervals for full 24-hour format (01:00 to 24:00)
for (let hour = 1; hour <= 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
        // Handle 24:00 as special case (midnight)
        const displayHour = hour === 24 ? 0 : hour;
        const timeString = `${displayHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        TIME_SLOTS.push(timeString);
    }
}

// Days of the week
const DAYS = [
    { name: 'Sun', full: 'Sunday', index: 0 },
    { name: 'Mon', full: 'Monday', index: 1 },
    { name: 'Tue', full: 'Tuesday', index: 2 },
    { name: 'Wed', full: 'Wednesday', index: 3 },
    { name: 'Thu', full: 'Thursday', index: 4 },
    { name: 'Fri', full: 'Friday', index: 5 },
    { name: 'Sat', full: 'Saturday', index: 6 }
];

// Initialize the application
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Initialize Supabase
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        
        // Check authentication
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            window.location.href = 'index.html';
            return;
        }

        currentUser = session.user;
        
        // Update user info in nav
        document.getElementById('userEmail').textContent = currentUser.email;

        // Initialize calendar
        currentWeekStart = getStartOfWeek(new Date());
        await loadCalendarData();
        renderCalendar();

        // Hide loading state
        document.getElementById('loadingState').classList.add('hidden');
        document.getElementById('calendarContainer').classList.remove('hidden');

    } catch (error) {
        console.error('Error initializing calendar:', error);
        showErrorState();
    }
});

// Get start of current week (Sunday)
function getStartOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
}

// Load availability and lessons data
async function loadCalendarData() {
    try {
        console.log('Loading calendar data for user:', currentUser.id);
        
        // Load tutor availability
        const { data: availability, error: availError } = await supabase
            .from('tutor_availability')
            .select('*')
            .eq('tutor_id', currentUser.id);

        if (availError) {
            console.error('Error loading availability:', availError);
        } else {
            // Convert to lookup object
            availabilityData = {};
            availability.forEach(slot => {
                const key = `${slot.day_of_week}-${slot.start_time}`;
                availabilityData[key] = slot;
            });
            console.log('Loaded availability:', availabilityData);
        }

        // Load lessons for current week
        const weekEnd = new Date(currentWeekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        const { data: lessons, error: lessonsError } = await supabase
            .from('lessons')
            .select('*')
            .eq('tutor_id', currentUser.id)
            .gte('lesson_date', currentWeekStart.toISOString().split('T')[0])
            .lte('lesson_date', weekEnd.toISOString().split('T')[0]);

        if (lessonsError) {
            console.error('Error loading lessons:', lessonsError);
        } else {
            // Convert to lookup object
            lessonsData = {};
            lessons.forEach(lesson => {
                const key = `${lesson.lesson_date}-${lesson.start_time}`;
                lessonsData[key] = lesson;
            });
            console.log('Loaded lessons:', lessonsData);
        }

    } catch (error) {
        console.error('Error loading calendar data:', error);
    }
}

// Render the calendar grid
function renderCalendar() {
    const grid = document.getElementById('calendarGrid');
    grid.innerHTML = '';

    // Update week range display
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    document.getElementById('weekRange').textContent = 
        `${formatDate(currentWeekStart)} - ${formatDate(weekEnd)}`;

    // Create header row
    const timeHeader = document.createElement('div');
    timeHeader.className = 'day-header';
    timeHeader.textContent = 'Time';
    grid.appendChild(timeHeader);

    // Day headers
    DAYS.forEach((day, index) => {
        const dayDate = new Date(currentWeekStart);
        dayDate.setDate(dayDate.getDate() + index);
        
        const dayHeader = document.createElement('div');
        dayHeader.className = 'day-header';
        dayHeader.innerHTML = `
            <div class="font-semibold">${day.name}</div>
            <div class="text-xs text-gray-500">${dayDate.getDate()}</div>
        `;
        grid.appendChild(dayHeader);
    });

    // Time slots
    TIME_SLOTS.forEach(time => {
        // Time label
        const timeLabel = document.createElement('div');
        timeLabel.className = 'time-label';
        timeLabel.textContent = formatTime(time);
        grid.appendChild(timeLabel);

        // Day slots
        DAYS.forEach((day, dayIndex) => {
            const slot = document.createElement('div');
            slot.className = 'time-slot';
            slot.dataset.day = day.index;
            slot.dataset.time = time;
            
            // Check availability and lessons
            const availKey = `${day.index}-${time}:00`;
            const dayDate = new Date(currentWeekStart);
            dayDate.setDate(dayDate.getDate() + dayIndex);
            const lessonKey = `${dayDate.toISOString().split('T')[0]}-${time}:00`;
            
            if (lessonsData[lessonKey]) {
                slot.classList.add('booked');
                slot.innerHTML = `<div class="text-xs p-1 text-center">Booked</div>`;
                slot.style.cursor = 'not-allowed';
            } else if (availabilityData[availKey] && availabilityData[availKey].is_available) {
                slot.classList.add('available');
                slot.addEventListener('click', () => toggleAvailability(day.index, time));
            } else {
                slot.addEventListener('click', () => toggleAvailability(day.index, time));
            }
            
            grid.appendChild(slot);
        });
    });
}

// Toggle availability for a time slot
function toggleAvailability(dayOfWeek, time) {
    const key = `${dayOfWeek}-${time}:00`;
    const slot = document.querySelector(`[data-day="${dayOfWeek}"][data-time="${time}"]`);
    
    if (slot.classList.contains('booked')) {
        return; // Can't change booked slots
    }
    
    if (slot.classList.contains('available')) {
        slot.classList.remove('available');
        if (availabilityData[key]) {
            availabilityData[key].is_available = false;
        }
    } else {
        slot.classList.add('available');
        if (!availabilityData[key]) {
            availabilityData[key] = {
                tutor_id: currentUser.id,
                day_of_week: dayOfWeek,
                start_time: time + ':00',
                end_time: getEndTime(time),
                is_available: true
            };
        } else {
            availabilityData[key].is_available = true;
        }
    }
}

// Get end time (30 minutes after start time)
function getEndTime(startTime) {
    const [hours, minutes] = startTime.split(':').map(Number);
    const endMinutes = minutes + 30;
    if (endMinutes >= 60) {
        return `${(hours + 1).toString().padStart(2, '0')}:${(endMinutes - 60).toString().padStart(2, '0')}:00`;
    }
    return `${hours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}:00`;
}

// Save availability to database
async function saveAvailability() {
    try {
        console.log('Saving availability...', availabilityData);
        
        // Prepare data for upsert
        const availabilityArray = Object.values(availabilityData).map(slot => ({
            tutor_id: currentUser.id,
            day_of_week: slot.day_of_week,
            start_time: slot.start_time,
            end_time: slot.end_time || getEndTime(slot.start_time.substring(0, 5)),
            is_available: slot.is_available
        }));

        // Delete existing availability for this tutor
        const { error: deleteError } = await supabase
            .from('tutor_availability')
            .delete()
            .eq('tutor_id', currentUser.id);

        if (deleteError) {
            throw deleteError;
        }

        // Insert new availability
        const availableSlots = availabilityArray.filter(slot => slot.is_available);
        
        if (availableSlots.length > 0) {
            const { error: insertError } = await supabase
                .from('tutor_availability')
                .insert(availableSlots);

            if (insertError) {
                throw insertError;
            }
        }

        // Show success message
        showSuccessMessage('Availability saved successfully!');
        
        // Reload data
        await loadCalendarData();

    } catch (error) {
        console.error('Error saving availability:', error);
        showErrorMessage('Failed to save availability. Please try again.');
    }
}

// Reset availability
function resetAvailability() {
    if (confirm('Are you sure you want to reset all availability? This will clear your current schedule.')) {
        availabilityData = {};
        renderCalendar();
    }
}

// Navigation functions
function previousWeek() {
    currentWeekStart.setDate(currentWeekStart.getDate() - 7);
    loadCalendarData().then(() => renderCalendar());
}

function nextWeek() {
    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    loadCalendarData().then(() => renderCalendar());
}

function goBackToTutorDashboard() {
    window.location.href = 'tutor-dashboard.html';
}

function handleLogout() {
    if (confirm('Are you sure you want to log out?')) {
        supabase.auth.signOut();
        window.location.href = 'index.html';
    }
}

// Utility functions
function formatDate(date) {
    return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
    });
}

function formatTime(time) {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    return `${hour.toString().padStart(2, '0')}:${minutes}`;
}

function showSuccessMessage(message) {
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}

function showErrorMessage(message) {
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}

function showErrorState() {
    document.getElementById('loadingState').classList.add('hidden');
    document.getElementById('calendarContainer').classList.add('hidden');
    document.getElementById('errorState').classList.remove('hidden');
}
