# MyBookStore - AI-Powered E-book Creation Platform

MyBookStore is a full-stack web application that empowers users to create professional e-books through an innovative, AI-driven workflow. The platform features step-by-step book creation, AI-generated content using Anthropic's Claude API, template selection, cover design, and multiple export formats.

## Features

- **AI-Powered Content Generation** - Generate book chapters using Anthropic Claude API
- **Multi-Step Workflow** - Guided book creation process from idea to export
- **Template System** - Multiple professional templates for book formatting
- **Cover Design** - Upload and preview custom book covers
- **Multiple Export Formats** - Export to PDF, EPUB, DOCX, and HTML
- **Database Persistence** - Save and resume book creation progress
- **Responsive Design** - Works on desktop and mobile devices

## Technology Stack

### Frontend
- **React 18+** with TypeScript
- **Vite** for build tooling and development server
- **Tailwind CSS** for styling
- **shadcn/ui** component library
- **TanStack Query** for state management
- **Wouter** for client-side routing

### Backend
- **Node.js** with Express.js
- **TypeScript** with ES modules
- **Drizzle ORM** with PostgreSQL
- **Anthropic Claude API** for AI content generation

## Prerequisites

Before installing MyBookStore, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **npm** or **yarn** package manager
- **PostgreSQL** database (v12 or higher)
- **Git** for cloning the repository

## Installation

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd mybookstore
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env` file in the root directory and add the following environment variables:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/mybookstore"
PGHOST=localhost
PGPORT=5432
PGUSER=your_username
PGPASSWORD=your_password
PGDATABASE=mybookstore

# Anthropic API Configuration
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Application Configuration
NODE_ENV=production
PORT=5000
```

### 4. Database Setup

#### Option A: Using PostgreSQL locally

1. Install PostgreSQL on your server
2. Create a new database:
```sql
CREATE DATABASE mybookstore;
```

3. Update the `DATABASE_URL` in your `.env` file with your database credentials

#### Option B: Using a Cloud Database (Recommended)

You can use cloud database services like:
- [Neon](https://neon.tech/) (Recommended for serverless PostgreSQL)
- [Supabase](https://supabase.com/)
- [Railway](https://railway.app/)
- [PlanetScale](https://planetscale.com/)

### 5. API Keys Setup

#### Get Anthropic API Key
1. Sign up at [Anthropic Console](https://console.anthropic.com/)
2. Create a new API key
3. Add it to your `.env` file as `ANTHROPIC_API_KEY`

### 6. Database Migration

Run the database migrations to set up the required tables:

```bash
npm run db:push
```

### 7. Build the Application

```bash
npm run build
```

## Running the Application

### Development Mode

```bash
npm run dev
```

The application will be available at `http://localhost:5000`

### Production Mode

```bash
npm start
```

## Deployment Options

### Option 1: Traditional VPS/Server

1. Set up a VPS with Ubuntu/CentOS
2. Install Node.js, PostgreSQL, and Nginx
3. Clone and configure the application
4. Use PM2 for process management:

```bash
npm install -g pm2
pm2 start "npm start" --name mybookstore
pm2 startup
pm2 save
```

5. Configure Nginx as reverse proxy:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Option 2: Docker Deployment

The repository includes complete Docker configuration files for easy deployment:

#### Quick Start with Docker

```bash
# Clone repository
git clone <your-repository-url>
cd mybookstore

# Copy environment template
cp .env.docker .env

# Edit .env file with your API keys
nano .env

# Start with Docker Compose
docker-compose up -d
```

#### Available Docker Files

- **`Dockerfile`** - Application container configuration
- **`docker-compose.yml`** - Development/local deployment
- **`docker-compose.prod.yml`** - Production deployment with Nginx reverse proxy
- **`nginx.conf`** - Nginx configuration for production
- **`.dockerignore`** - Optimized Docker build context
- **`init-db.sql`** - Database initialization script

#### Production Deployment

For production environments:

```bash
# Use production compose configuration
docker-compose -f docker-compose.prod.yml up -d
```

#### Key Features

- **Multi-container setup** with app, database, and Nginx
- **Volume persistence** for database data
- **Health checks** and restart policies
- **SSL/HTTPS ready** configuration
- **Resource limits** and scaling options

For detailed Docker deployment instructions, see [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md)

#### PDF Export Fix
The Docker containers now include Chrome/Chromium for PDF generation. If PDF export fails, the system provides a fallback HTML file with browser conversion instructions. See [PUPPETEER_FIX.md](PUPPETEER_FIX.md) for troubleshooting.

### Option 3: Cloud Platform Deployment

The application can be deployed to various cloud platforms:

- **Vercel** (Frontend) + **Railway/Neon** (Database)
- **Heroku** with Heroku Postgres
- **DigitalOcean App Platform**
- **AWS** with RDS
- **Google Cloud Run**

## Configuration

### Environment Variables Reference

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Yes | `postgresql://user:pass@host:5432/db` |
| `ANTHROPIC_API_KEY` | Anthropic Claude API key | Yes | `sk-ant-api03-...` |
| `NODE_ENV` | Application environment | No | `production` |
| `PORT` | Server port | No | `5000` |
| `PGHOST` | PostgreSQL host | Yes | `localhost` |
| `PGPORT` | PostgreSQL port | Yes | `5432` |
| `PGUSER` | PostgreSQL username | Yes | `postgres` |
| `PGPASSWORD` | PostgreSQL password | Yes | `password` |
| `PGDATABASE` | PostgreSQL database name | Yes | `mybookstore` |

### Application Settings

You can customize the application behavior by modifying:

- **Default number of chapters**: Edit `numberOfChapters: 5` in `client/src/pages/create-book.tsx`
- **Available templates**: Modify template options in the template selection step
- **Export formats**: Configure available formats in `server/exportGenerator.ts`

## API Endpoints

The application exposes the following API endpoints:

- `POST /api/books` - Create a new book
- `PUT /api/books/:id` - Update book details
- `GET /api/books/:id` - Get book by ID
- `POST /api/books/:id/progress` - Save progress
- `POST /api/chapters/generate` - Generate chapters with AI
- `POST /api/chapters/regenerate` - Regenerate specific chapter
- `POST /api/export/:format` - Export book in specified format

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify PostgreSQL is running
   - Check DATABASE_URL format
   - Ensure database exists and user has permissions

2. **API Key Issues**
   - Verify ANTHROPIC_API_KEY is correct
   - Check API key has sufficient credits
   - Ensure no extra spaces in .env file

3. **Build Errors**
   - Clear node_modules and reinstall: `rm -rf node_modules package-lock.json && npm install`
   - Check Node.js version compatibility

4. **Port Already in Use**
   - Change PORT in .env file
   - Kill existing processes: `lsof -ti:5000 | xargs kill -9`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm test`
5. Submit a pull request

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Support

For support and questions:

1. Check the troubleshooting section above
2. Review the [GitHub Issues](../../issues)
3. Create a new issue with detailed information about your problem

## Updates and Maintenance

### Keeping Dependencies Updated

```bash
# Check for outdated packages
npm outdated

# Update dependencies
npm update

# Update database schema
npm run db:push
```

### Backup and Recovery

Regular database backups are recommended:

```bash
# Backup database
pg_dump mybookstore > backup_$(date +%Y%m%d).sql

# Restore database
psql mybookstore < backup_20240128.sql
```

---

**Note**: This application requires an active Anthropic API key for AI content generation. Make sure you have sufficient API credits and monitor usage to avoid service interruptions.