# intask

Modern task and project management platform built with Next.js.

## Overview

intask is a collaborative task management application that enables teams to organize projects, assign tasks, track progress, and collaborate effectively. Built with modern web technologies and a clean architecture.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Clerk
- **UI**: React 19, Tailwind CSS, Radix UI components
- **Rich Text**: Yoopta Editor
- **Drag & Drop**: dnd-kit

## Features

- **Projects**: Create and manage projects with custom descriptions
- **Tasks**: Organize tasks with priorities, statuses, deadlines, and assignments
- **Team Collaboration**: Invite team members via email invitations
- **Task Management**: Drag-and-drop task organization, status tracking (ToDo, InProgress, Review, Done)
- **Analytics**: Project analytics and insights
- **Rich Text Editing**: Rich text editor for task descriptions

## Test Account for Demo

test@gmail.com:123456

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL (or Docker Compose)
- Clerk account and API keys

### Installation

1. Clone the repository
2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables (create `.env`):

   ```env
   DATABASE_URL="postgresql://user:password@localhost:5011/intask"
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
   CLERK_SECRET_KEY=your_clerk_secret
   ```

4. Start PostgreSQL (using Docker Compose):

   ```bash
   docker compose up -d
   ```

5. Run database migrations:

   ```bash
   npx prisma migrate dev
   ```

6. Start the development server:

   ```bash
   npm run dev
   ```

7. Open [http://localhost:3000](http://localhost:3000) in your browser
