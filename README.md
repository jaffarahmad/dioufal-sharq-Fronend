# Diouf Al-Sharq CMS

A comprehensive Content Management System for business operations including quotations, invoices, projects, and workforce management.

## Project Structure

```
diouf-al-sharq-cms/
├── client/                 # React frontend application
│   ├── public/            # Static assets
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── contexts/      # React contexts
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utility libraries
│   │   ├── pages/         # Application pages
│   │   └── utils/         # Utility functions
│   └── package.json
├── server/                # Node.js backend application
│   ├── src/
│   │   ├── db.ts          # Database configuration
│   │   ├── email.ts       # Email service
│   │   ├── index.ts       # Server entry point
│   │   ├── routes.ts      # API routes
│   │   ├── seed-data.ts   # Database seeding
│   │   ├── storage.ts     # File storage handling
│   │   ├── vite.ts        # Vite integration
│   │   └── zatca-qr.ts    # QR code generation
│   └── package.json
├── shared/                # Shared types and schemas
├── tax-invoice-template/  # Standalone invoice template
├── .env.example          # Environment variables template
├── components.json       # shadcn/ui configuration
├── drizzle.config.ts     # Database ORM configuration
├── eslint.config.js      # ESLint configuration
├── package.json          # Root package configuration
├── tailwind.config.ts    # Tailwind CSS configuration
├── tsconfig.json         # TypeScript configuration
└── vite.config.ts        # Vite build configuration
```

## Features

- **Quotation Management**: Create, edit, and manage business quotations
- **Invoice Generation**: Generate professional invoices with PDF export
- **Project Tracking**: Monitor project progress and milestones
- **Workforce Management**: Manage employees, wages, and manpower
- **Supplier Management**: Track suppliers and purchase orders
- **Financial Reports**: Generate monthly reports and payment tracking
- **User Authentication**: Secure login and user management
- **Modern UI**: Built with React, TypeScript, and Tailwind CSS

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- MongoDB database
- SMTP server for email functionality

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
# Install root dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..

# Install server dependencies
cd server
npm install
cd ..
```

### 2. Environment Configuration

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Update the `.env` file with your configuration:
   ```env
   DATABASE_URL="mongodb://localhost:27017/diouf-al-sharq-cms"
   JWT_SECRET="your-jwt-secret-key"
   SMTP_HOST="your-smtp-host"
   SMTP_PORT=587
   SMTP_USER="your-email@domain.com"
   SMTP_PASS="your-email-password"
   UPLOAD_DIR="./uploads"
   ```

### 3. Database Setup

```bash
# Push database schema
npm run db:push

# Seed initial data (optional)
npm run dev
# The server will automatically seed data on first run
```

## Development

### Start Development Server

```bash
# Start both client and server in development mode
npm run dev
```

This will start:
- Client development server on `http://localhost:5173`
- Server API on `http://localhost:3000`

### Available Scripts

#### Root Level
- `npm run dev` - Start development servers
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run typecheck` - Run TypeScript type checking
- `npm run clean` - Clean build artifacts
- `npm run db:push` - Push database schema changes

#### Client
- `npm run dev` - Start client development server
- `npm run build` - Build client for production
- `npm run preview` - Preview production build
- `npm run lint` - Lint client code
- `npm run format` - Format client code

#### Server
- `npm run dev` - Start server in development mode
- `npm run build` - Build server for production
- `npm run start` - Start production server

## Production Deployment

### Build for Production

```bash
npm run build
```

### Start Production Server

```bash
npm run start
```

### Environment Variables for Production

Ensure all environment variables are properly set in your production environment:

- `DATABASE_URL` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `SMTP_*` - Email service configuration
- `NODE_ENV=production`

## Technology Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - UI component library
- **React Query** - Data fetching and caching
- **React Router** - Client-side routing

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **Drizzle ORM** - Database ORM
- **MongoDB** - Database
- **JWT** - Authentication
- **Nodemailer** - Email service

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TypeScript** - Static type checking

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make your changes and commit: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature/new-feature`
5. Submit a pull request

### Code Style

- Run `npm run lint` to check for linting errors
- Run `npm run format` to format code
- Follow TypeScript best practices
- Write meaningful commit messages

## License

This project is proprietary software. All rights reserved.

## Support

For support and questions, please contact the development team.
