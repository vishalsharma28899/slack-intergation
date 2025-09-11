# ChatBridge - Customer Support Chat Application

## Overview

ChatBridge is a full-stack customer support chat application built with React, Express.js, and Socket.IO. The application provides real-time chat capabilities between customers and support teams, with AI-powered auto-replies and Slack integration for support agents.

## Features

- Real-time chat between customers and support agents
- AI-powered auto-replies using OpenAI
- Slack integration for support team collaboration
- Modern UI built with shadcn/ui components
- PostgreSQL database for data persistence

## Environment Setup

To make this application reusable, follow these steps to set up your environment:

1. **Clone the repository**

2. **Install dependencies**
   ```
   npm install
   ```

3. **Configure environment variables**
   - Copy the `.env.example` file to create a new `.env` file
   ```
   cp .env.example .env
   ```
   - Update the `.env` file with your actual credentials:
     - `DATABASE_URL`: Your PostgreSQL database connection string
     - `OPENAI_API_KEY`: Your OpenAI API key for AI-powered responses
     - `SLACK_API_TOKEN`: Your Slack API token for integration
     - `SESSION_SECRET`: A secure random string for session encryption

4. **Database setup**
   - Make sure your PostgreSQL database is running
   - Run database migrations
   ```
   npm run db:push
   ```

5. **Start the development server**
   ```
   npm run dev
   ```

6. **Build for production**
   ```
   npm run build
   ```

7. **Start the production server**
   ```
   npm run start
   ```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | The port on which the server will run | No (defaults to 5000) |
| `NODE_ENV` | Environment mode (development/production) | No (defaults to development) |
| `DATABASE_URL` | MongoDB database connection string | Yes |
| `OPENAI_API_KEY` | OpenAI API key for AI responses | Yes for AI features |
| `SLACK_API_TOKEN` | Slack API token for integration | Yes for Slack integration |
| `SLACK_SUPPORT_CHANNEL` | Slack channel for support messages | No (defaults to #support) |
| `SESSION_SECRET` | Secret for session encryption | Yes for secure sessions |

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **Real-time Communication**: Socket.IO client for bidirectional communication

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Real-time Features**: Socket.IO server for WebSocket connections and real-time messaging
- **API Design**: RESTful endpoints for user management, conversations, and messages
- **Database**: MongoDB with Mongoose ODM for document-based data storage

## License

MIT