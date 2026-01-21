# Project Tracker Dashboard

A modern, clean web dashboard for tracking project phases and tasks. Built with React, TypeScript, and Tailwind CSS.

## Features

- **Project Management**: Create and manage multiple projects
- **Phase Tracking**: Organize work into sequential phases with visual flow
- **Task Management**: Add tasks to phases with optional due dates
- **Auto Progress Calculation**: Phase progress automatically updates based on task completion
- **Status Tracking**: Phases automatically transition between Not Started, In Progress, and Completed
- **Interactive UI**: Edit phase names inline, expand phase details in a side drawer
- **Responsive Design**: Desktop-first with clean, modern SaaS styling

## Tech Stack

- React 18
- TypeScript
- Tailwind CSS v4
- Vite
- Radix UI Components
- Lucide Icons

## Getting Started

### Prerequisites

- Node.js 18+ and npm/pnpm/yarn
- A Supabase Project (Database)

### Database Setup

1. Go to your **Supabase Dashboard** -> **SQL Editor**.
2. Run the migration for subtasks if you haven't (from `src/migration.sql`).
3. **CRITICAL**: Run `src/migration_tasks_position.sql` to enable Drag & Drop ordering.
   - Without this, the app will crash on load.
4. Get your `SUPABASE_URL` and `SUPABASE_ANON_KEY` from **Project Settings** -> **API**.
5. Add them to your `.env` file.

### Installation

```bash
# Install dependencies
npm install
# or
pnpm install
# or
yarn install
```

### Development

```bash
# Start development server
npm run dev
# or
pnpm dev
# or
yarn dev
```

### Build

```bash
# Build for production
npm run build
# or
pnpm build
# or
yarn build
```

The build output will be in the `dist` folder.

## Deployment

### Deploy to Vercel

#### Option 1: Deploy via Vercel CLI

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

3. Follow the prompts to link/create your project

4. For production deployment:
```bash
vercel --prod
```

#### Option 2: Deploy via GitHub Integration

1. Push your code to GitHub (see instructions below)

2. Go to [vercel.com](https://vercel.com)

3. Click "Add New Project"

4. Import your GitHub repository

5. Vercel will auto-detect Vite and configure build settings:
   - **Build Command**: `vite build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install` (or auto-detected)

6. Click "Deploy"

Your app will be live at `https://your-project.vercel.app`

### Deploy to Other Platforms

The build output is a static site in the `dist` folder. You can deploy it to:
- Netlify
- GitHub Pages
- Cloudflare Pages
- Any static hosting service

## Git Setup

### Initialize Repository

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Project Tracker Dashboard"
```

### Push to GitHub

```bash
# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

### Push to GitLab/Bitbucket

```bash
# For GitLab
git remote add origin https://gitlab.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main

# For Bitbucket
git remote add origin https://bitbucket.org/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

## Project Structure

```
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── AddPhaseDialog.tsx
│   │   │   ├── AddProjectDialog.tsx
│   │   │   ├── PhaseCard.tsx
│   │   │   ├── PhaseDetails.tsx
│   │   │   ├── TaskItem.tsx
│   │   │   └── ui/              # Reusable UI components
│   │   └── App.tsx              # Main application
│   └── styles/
│       ├── fonts.css
│       ├── index.css
│       ├── tailwind.css
│       └── theme.css
├── package.json
├── vite.config.ts
└── README.md
```

## License

MIT
