# E-book Creation Platform (Bookster.cc)

## Overview

This is a full-stack web application for AI-powered e-book creation called Bookster.cc. The platform allows users to create professional e-books with AI-generated content and covers, featuring interactive book idea generation tools, subscription management, and publishing capabilities to platforms like Amazon KDP.

## Recent Changes (January 2025)

### Template System Implementation
- **Step 4: Template Selection** - Added comprehensive template system with 6 design options
- **Live Template Previews** - Users can preview how text will look with different typography styles
- **Applied Template Styling** - Chapter content displays with selected template formatting
- **Premium Template System** - Original Design (free) with 5 premium options (Modern, Creative, Classic, Business, Academic)

### Cover Design & Export Features  
- **Step 5: Cover Design** - Implemented cover image upload functionality with preview
- **Step 6: Export System** - Added comprehensive export options (PDF, EPUB, DOCX)
- **Cover Integration** - Uploaded cover images carry through to export preview
- **Export Options** - Include cover page, table of contents, and page numbering settings
- **Export API** - Backend routes for handling PDF, EPUB, and DOCX export requests
- **Loading States** - Export progress indicators with format-specific feedback

### AI Integration
- **Anthropic Claude API** - Integrated for chapter generation using claude-sonnet-4-20250514
- **Chapter Management** - Expand/collapse, regenerate individual chapters, and delete functionality
- **Loading States** - Proper UI feedback during AI generation processes

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Routing**: Wouter for client-side routing with simple route definitions
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS custom properties for theming (light/dark mode support)
- **State Management**: TanStack Query for server state management with custom query client configuration
- **Form Handling**: React Hook Form with Zod validation through hookform resolvers

### Backend Architecture
- **Runtime**: Node.js with Express.js server framework
- **Language**: TypeScript with ES modules
- **Development**: Hot module replacement via Vite integration in development mode
- **API Design**: RESTful API structure with centralized route registration
- **Error Handling**: Global error middleware with structured error responses
- **Logging**: Custom request/response logging with performance metrics

### Database Architecture
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Database**: PostgreSQL (configured for Neon serverless)
- **Schema Management**: Code-first approach with migration support
- **Connection**: @neondatabase/serverless for serverless PostgreSQL connections
- **Session Storage**: PostgreSQL-backed sessions using connect-pg-simple

### Data Models
- **Users**: Authentication with username, email, password, and timestamps
- **Books**: User-generated content with metadata (title, topic, audience, style, status)
- **Subscriptions**: Multi-tier plans (lite, pro, agency) with credit-based usage tracking

### Storage Strategy
- **Development**: In-memory storage implementation for rapid development
- **Production**: PostgreSQL with Drizzle ORM for data persistence
- **Interface Pattern**: Abstract storage interface allowing easy switching between implementations

### Authentication & Authorization
- **Session-based**: Traditional server-side sessions stored in PostgreSQL
- **Credentials**: Secure cookie handling with proper CORS configuration
- **User Management**: Complete user lifecycle with registration, login, and profile management

## External Dependencies

### Core Frontend Libraries
- **React Ecosystem**: React 18+ with React DOM, React Query for data fetching
- **UI Framework**: Extensive Radix UI primitive collection for accessible components
- **Styling**: Tailwind CSS with PostCSS processing and Autoprefixer
- **Routing**: Wouter for lightweight client-side routing
- **Date Handling**: date-fns for date manipulation and formatting

### Backend Dependencies
- **Database**: Drizzle ORM with PostgreSQL driver and Neon serverless adapter
- **Validation**: Zod schema validation with Drizzle integration
- **Session Management**: Express sessions with PostgreSQL store
- **Development**: tsx for TypeScript execution, esbuild for production builds

### Build & Development Tools
- **Bundler**: Vite with React plugin and custom configuration
- **TypeScript**: Strict TypeScript configuration with path mapping
- **Development**: Replit-specific plugins for error overlay and cartographer integration
- **Deployment**: esbuild for server bundling, Vite for client builds

### Database Services
- **Primary Database**: Neon PostgreSQL (serverless PostgreSQL platform)
- **ORM**: Drizzle with full PostgreSQL feature support
- **Migrations**: Drizzle Kit for schema migrations and database management
- **Connection Pooling**: Built-in connection management through Neon serverless driver