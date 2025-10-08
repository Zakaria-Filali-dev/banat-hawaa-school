# 🎓 Banat Hawaa Tutoring School Management System

A comprehensive, enterprise-grade school management platform built with React and Supabase, designed specifically for tutoring schools and educational institutions.

## ✨ Features

### 👥 **Multi-Role Dashboard System**

- **Admin Dashboard**: Complete school management, user oversight, and system administration
- **Teacher Dashboard**: Assignment creation, grade management, and student progress tracking
- **Student Dashboard**: Assignment submissions, grade viewing, and progress monitoring

### 📚 **Academic Management**

- **Assignment System**: Create, distribute, and manage assignments with file attachments
- **Grade Management**: Comprehensive grading system with detailed feedback
- **Subject Organization**: Multi-subject support with teacher assignments
- **File Management**: Secure file upload/download with preview capabilities

### 🔐 **Security & Authentication**

- **Enterprise-grade authentication** with timeout handling and offline support
- **Role-based access control** (Admin, Teacher, Student)
- **Secure file storage** with Supabase integration
- **Real-time session management** with automatic recovery

### 🎨 **Professional UI/UX**

- **Glassmorphism design** with modern aesthetics
- **Fully responsive** mobile and desktop experience
- **Dark theme** with professional purple accent colors
- **Smooth animations** and interactive feedback

## 🚀 **Technology Stack**

- **Frontend**: React 19 + Vite 6
- **Backend**: Supabase (PostgreSQL + Real-time + Storage)
- **Authentication**: Supabase Auth with JWT
- **Styling**: Custom CSS with glassmorphism effects
- **File Storage**: Supabase Storage with secure access
- **Deployment**: Vercel (Frontend) + Supabase (Backend)

## 📋 **Quick Start**

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/Zakaria-Filali-dev/banat-hawaa-school.git
   cd banat-hawaa-school
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment setup**

   ```bash
   cp .env.example .env
   ```

   Fill in your Supabase credentials in `.env`

4. **Start development server**

   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

## 🔧 **Environment Variables**

Create a `.env` file with the following variables:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Backend Configuration (API routes)
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Email Configuration (Optional)
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
SMTP_FROM=Your School Name <email@domain.com>
```

## 📚 **Documentation**

Comprehensive documentation is available in the `/documentation` folder:

- **[Deployment Guide](./documentation/VERCEL_DEPLOYMENT.md)** - Step-by-step deployment instructions
- **[Security Guide](./documentation/SECURITY_GUIDE.md)** - Security best practices and configuration
- **[Email Setup](./documentation/EMAIL_SETUP_GUIDE.md)** - Email system configuration
- **[Supabase Setup](./documentation/SUPABASE_PRODUCTION.md)** - Database and backend setup

## 🎯 **User Roles & Permissions**

### 🔑 **Admin**

- Manage all users (students, teachers, admins)
- Create and assign subjects to teachers
- System-wide configuration and monitoring
- Access to all assignments and grades

### 👨‍🏫 **Teacher**

- Create and manage assignments for assigned subjects
- Grade student submissions with detailed feedback
- View student progress and performance analytics
- Manage class rosters and subject materials

### 🎓 **Student**

- View assigned homework and submissions
- Submit assignments with file attachments
- Track grades and progress across subjects
- Access course materials and announcements

## 🔐 **Security Features**

- **JWT Authentication** with automatic token refresh
- **Role-based authorization** at API and UI level
- **File access control** with signed URLs
- **Rate limiting** on sensitive operations
- **Input validation** and SQL injection prevention
- **Secure password policies** and encryption

## 📱 **Responsive Design**

The application is fully responsive and optimized for:

- **Desktop**: Full-featured dashboard experience
- **Tablet**: Touch-optimized interface with gesture support
- **Mobile**: Streamlined mobile experience with essential features

## 🚀 **Performance**

- **Optimized bundle size** with code splitting
- **Lazy loading** for improved initial load times
- **Image optimization** and WebP support
- **CDN delivery** via Vercel Edge Network
- **Real-time updates** with minimal latency

## 📞 **Support**

For support, feature requests, or bug reports, please contact:

- **Email**: [zakifilali42@gmail.com](mailto:zakifilali42@gmail.com)
- **GitHub Issues**: [Create an issue](https://github.com/Zakaria-Filali-dev/banat-hawaa-school/issues)

## 📄 **License**

This project is proprietary software developed for Banat Hawaa Tutoring School.

---

**Built with ❤️ by Zakaria Filali** | **Production Ready** ✅
