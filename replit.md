# Overview

CivicReport is a comprehensive civic issue reporting system that allows citizens to report municipal problems like potholes, garbage overflow, broken streetlights, and other infrastructure issues. The system features AI-powered image recognition, voice transcription in multiple languages (English, Hindi, Marathi), and real-time issue tracking. It's designed to bridge the gap between citizens and local government departments, making civic engagement more accessible and efficient.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack React Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Mobile-First Design**: Responsive layout optimized for mobile devices

## Backend Architecture
- **Runtime**: Node.js with Express.js REST API
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Session Management**: Express sessions with PostgreSQL storage
- **File Uploads**: Multer middleware for handling image and audio files
- **API Design**: RESTful endpoints with consistent error handling

## Database Schema
- **Issues Table**: Core entity storing civic reports with location, type, status, and priority
- **Users Table**: Citizen profiles with contact information and language preferences
- **Departments Table**: Municipal departments responsible for different issue types
- **Issue Status History**: Audit trail tracking status changes over time
- **Issue Comments**: Communication thread between citizens and administrators
- **Sessions Table**: User session storage for authentication

## Authentication & Authorization
- **Session-Based Auth**: Server-side sessions stored in PostgreSQL
- **No User Registration**: Simplified access without mandatory account creation
- **Role-Based Access**: Differentiated views for citizens vs. administrators
- **Language Support**: Multi-language interface (English, Hindi, Marathi)

## AI Integration Architecture
- **Image Analysis**: OpenAI GPT-4 Vision for automatic issue type detection and description generation
- **Voice Processing**: OpenAI Whisper API for speech-to-text transcription
- **Natural Language Processing**: Text analysis to extract issue details and priority from descriptions
- **Confidence Scoring**: AI provides confidence levels for automated classifications

## Real-Time Features
- **Issue Tracking**: Real-time status updates from submission to resolution
- **Geographic Mapping**: GPS coordinates and address resolution for precise location tracking
- **Status Notifications**: Progress updates through the issue lifecycle
- **Department Routing**: Automatic assignment to appropriate municipal departments

# External Dependencies

## AI Services
- **OpenAI API**: GPT-4 for image analysis and text processing, Whisper for voice transcription
- **Image Recognition**: Computer vision for civic issue classification (potholes, garbage, streetlights, etc.)
- **Speech-to-Text**: Multi-language voice input processing

## Database & Storage
- **Neon PostgreSQL**: Serverless PostgreSQL database with connection pooling
- **File Storage**: Local file system for uploaded images and audio recordings
- **Session Store**: PostgreSQL-backed session management with connect-pg-simple

## Development & Deployment
- **Replit Integration**: Development environment with hot reloading and error overlays
- **Vite Plugins**: Development banner, cartographer for code visualization
- **Build Tools**: esbuild for server bundling, Vite for client bundling

## UI & Styling
- **Radix UI**: Accessible component primitives for dialogs, forms, and interactive elements
- **Lucide React**: Icon library for consistent visual elements
- **Tailwind CSS**: Utility-first styling with custom design tokens
- **PostCSS**: CSS processing with autoprefixer for browser compatibility

## Communication APIs (Future)
- **Twilio/Exotel**: IVR system for phone-based reporting (referenced in requirements)
- **SMS Notifications**: Status updates via text messaging
- **Email Integration**: Departmental notifications and citizen updates