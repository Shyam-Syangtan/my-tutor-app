# Tutor Marketplace - Next.js Version

A modern, full-stack tutor marketplace application built with Next.js 15, featuring server-side rendering, real-time messaging, and comprehensive tutor-student management.

## 🚀 Features

### Core Functionality
- **User Authentication**: Google OAuth integration with role-based access
- **Tutor Marketplace**: Browse, search, and filter qualified tutors
- **Real-time Messaging**: Direct communication between students and tutors
- **Lesson Booking**: Schedule and manage lessons with approval workflow
- **Dashboard Management**: Separate dashboards for students and tutors
- **Profile Management**: Comprehensive user and tutor profiles

### Technical Features
- **Hybrid Rendering**: SSR for SEO-critical pages, CSR for interactive components
- **Real-time Updates**: Live messaging and notifications
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Type Safety**: Full TypeScript implementation
- **Database Integration**: Supabase for backend services

## 🛠 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (Google OAuth)
- **Real-time**: Supabase Realtime
- **Deployment**: Vercel

## 📁 Project Structure

```
nextjs-version/
├── src/
│   ├── app/                    # App Router pages
│   │   ├── auth/              # Authentication routes
│   │   ├── dashboard/         # Main dashboard
│   │   ├── marketplace/       # Tutor marketplace
│   │   ├── messages/          # Messaging interface
│   │   ├── student-dashboard/ # Student-specific dashboard
│   │   ├── tutor-dashboard/   # Tutor-specific dashboard
│   │   └── tutor/[id]/       # Dynamic tutor profiles
│   ├── components/            # Reusable React components
│   │   ├── AuthProvider.tsx   # Authentication context
│   │   ├── Header.tsx         # Navigation header
│   │   ├── Footer.tsx         # Site footer
│   │   ├── TutorCard.tsx      # Tutor display card
│   │   ├── MessagesPage.tsx   # Messaging interface
│   │   └── ...               # Other components
│   └── lib/                   # Utility libraries
│       ├── supabase.ts        # Client-side Supabase
│       ├── supabase-server.ts # Server-side Supabase
│       └── messagingService.ts # Messaging utilities
├── public/                    # Static assets
├── DEPLOYMENT_GUIDE.md       # Deployment instructions
└── README.md                 # This file
```

## 🚦 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account and project

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd nextjs-version
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create `.env.local` file:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Database Setup**
   - Set up Supabase project
   - Run the provided SQL scripts for table creation
   - Configure Row Level Security (RLS) policies

5. **Run Development Server**
   ```bash
   npm run dev
   ```

6. **Open Application**
   Navigate to `http://localhost:3000`

## 🗄 Database Schema

### Core Tables
- `users` - User profiles and authentication
- `tutors` - Tutor-specific information
- `messages` - Real-time messaging
- `lessons` - Lesson bookings and scheduling
- `tutor_availability` - Tutor schedule management

### Key Features
- Row Level Security (RLS) for data protection
- Real-time subscriptions for messaging
- Optimized queries for performance

## 🔐 Authentication Flow

1. **Google OAuth**: Users sign in with Google
2. **Role Assignment**: Users are assigned student/tutor roles
3. **Protected Routes**: Role-based access control
4. **Session Management**: Persistent authentication state

## 📱 Responsive Design

- **Mobile First**: Optimized for mobile devices (320px+)
- **Tablet Support**: Enhanced experience for tablets (768px+)
- **Desktop**: Full-featured desktop interface (1024px+)
- **Touch Friendly**: 44px minimum touch targets

## 🚀 Deployment

### Vercel (Recommended)
1. Connect GitHub repository to Vercel
2. Configure environment variables
3. Deploy with automatic CI/CD

See `DEPLOYMENT_GUIDE.md` for detailed instructions.

### Alternative Platforms
- Netlify
- Railway
- DigitalOcean App Platform

## 🧪 Testing

### Development Testing
```bash
npm run build    # Test production build
npm run start    # Test production server
npm run lint     # Check code quality
```

### Manual Testing Checklist
- [ ] User authentication (Google OAuth)
- [ ] Role-based navigation
- [ ] Tutor marketplace browsing
- [ ] Search and filtering
- [ ] Messaging functionality
- [ ] Lesson booking workflow
- [ ] Dashboard functionality
- [ ] Mobile responsiveness

## 🔧 Configuration

### Next.js Configuration
- App Router enabled
- Image optimization configured
- TypeScript strict mode
- ESLint integration

### Tailwind CSS
- Custom color scheme
- Responsive utilities
- Component classes

### Supabase Integration
- Client and server-side clients
- Real-time subscriptions
- Authentication helpers

## 📈 Performance

### Optimization Features
- Server-side rendering for SEO
- Image optimization
- Code splitting
- Lazy loading
- Efficient bundle size

### Monitoring
- Vercel Analytics integration
- Performance metrics tracking
- Error monitoring setup

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

### Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

### Common Issues
- Build failures: Check environment variables
- Authentication issues: Verify Supabase configuration
- Styling issues: Check Tailwind CSS setup

## 🔄 Migration from React Version

This Next.js version provides:
- Better SEO with server-side rendering
- Improved performance
- Enhanced developer experience
- Better deployment options
- Advanced routing capabilities

## 🎯 Future Enhancements

- [ ] Video calling integration
- [ ] Payment processing
- [ ] Advanced scheduling
- [ ] Mobile app (React Native)
- [ ] AI-powered tutor matching
- [ ] Multi-language support

## 📊 Analytics

- User engagement tracking
- Performance monitoring
- Error reporting
- Usage analytics

---

**Built with ❤️ using Next.js and Supabase**
