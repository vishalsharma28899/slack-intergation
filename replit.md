# Customer Support Chat Application

## Overview

This is a full-stack customer support chat application built with React, Express.js, and Socket.IO. The application provides real-time chat capabilities between customers and support teams, with AI-powered auto-replies and Slack integration for support agents. It features a modern UI using shadcn/ui components and Tailwind CSS, with PostgreSQL for data persistence via Drizzle ORM.

## User Preferences

Preferred communication style: Simple, everyday language.

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
- **Error Handling**: Centralized error middleware with structured error responses
- **Development**: Hot module replacement via Vite middleware in development mode

### Data Storage
- **Database**: PostgreSQL with connection pooling via Neon serverless
- **ORM**: Drizzle ORM for type-safe database operations and schema management
- **Schema Design**: Three main entities - users, conversations, and messages with proper relationships
- **Session Management**: PostgreSQL session store using connect-pg-simple

### Authentication and Authorization
- **User System**: Simple email/username based user creation and identification
- **Session Persistence**: Local storage for user credentials with automatic reconnection
- **Access Control**: Basic user identification for message attribution and conversation ownership

### External Dependencies
- **AI Integration**: OpenAI GPT-5 API for generating automated customer support responses
- **Communication Platform**: Slack Web API for routing messages to support channels and enabling agent responses
- **Database Provider**: Neon serverless PostgreSQL for cloud database hosting
- **Real-time Infrastructure**: Socket.IO for WebSocket connections with fallback to polling
- **UI Framework**: Radix UI primitives for accessible, unstyled components
- **Development Tools**: Replit-specific plugins for development environment integration

The architecture supports seamless handoffs between AI and human agents, with conversation state preserved across different interaction channels (web chat, Slack). The system is designed for scalability with serverless database connections and real-time message broadcasting to multiple clients.