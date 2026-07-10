# Migration Guide: Electron + Vite → Next.js + Vercel

This document outlines the migration from the original Electron desktop application to a modern Next.js web application optimized for Vercel deployment.

## What Changed

### Build System
- **Old**: Electron + Vite
- **New**: Next.js 14+ with Turbopack

### Project Structure
```
OLD:
├── electron.js (main process)
├── preload.js
├── vite.config.js
├── index.html
├── src/ (React components)
└── api/ (Express server files)

NEW:
├── app/ (Next.js App Router)
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   └── api/ (API routes)
├── components/ (reusable components)
├── next.config.ts
├── tailwind.config.ts
└── vercel.json
```

### Configuration Files Removed
- `vite.config.js` - Replaced with Next.js build system
- `electron.js`, `preload.js` - Electron no longer needed
- `index.html` - Next.js handles HTML generation
- `package-lock.json` - Use `pnpm-lock.yaml` or `package-lock.json` consistently

### Configuration Files Added
- `next.config.ts` - Next.js configuration
- `tailwind.config.ts` - Tailwind CSS v3 configuration
- `.eslintrc.json` - ESLint for Next.js
- `vercel.json` - Vercel deployment configuration
- `.vercelignore` - Files to exclude from Vercel builds
- `.env.example` - Environment variables template

### Scripts Changed

**OLD package.json scripts:**
```json
"dev": "vite",
"build": "vite build",
"electron": "electron .",
"electron-dev": "concurrently \"npm run dev\" \"wait-on http://localhost:5173 && electron .\""
```

**NEW package.json scripts:**
```json
"dev": "next dev",
"build": "next build",
"start": "next start",
"type-check": "tsc --noEmit"
```

### Development Workflow

**Old Workflow:**
1. Start Vite dev server
2. Wait for build
3. Start Electron app
4. Dev server runs on port 5173

**New Workflow:**
1. Run `npm run dev`
2. Dev server runs on port 3000
3. Hot Module Replacement enabled automatically
4. Open browser to http://localhost:3000

## Migration Checklist

### Components & Code
- [ ] Move existing React components from `src/` to `components/`
- [ ] Update imports from relative paths to absolute paths if needed
- [ ] Remove Electron-specific code (IPC, Main process code)
- [ ] Update API calls from Express server to Next.js API routes
- [ ] Convert class components to functional components if needed
- [ ] Update useState/useEffect hooks for server components where applicable

### Styling
- [ ] Verify Tailwind CSS classes work with new config
- [ ] Update dark mode implementation if needed
- [ ] Remove any Vite-specific CSS imports

### APIs & Backend
- [ ] Move Express routes to `app/api/` directory
- [ ] Update API endpoints to match new structure
- [ ] Configure CORS if needed for external requests
- [ ] Set up environment variables in Vercel

### Testing & Validation
- [ ] Run `npm run type-check` to verify TypeScript
- [ ] Test development server: `npm run dev`
- [ ] Build and test: `npm run build && npm start`
- [ ] Verify all routes work correctly

### Deployment
- [ ] Connect repository to Vercel
- [ ] Set environment variables in Vercel dashboard
- [ ] Configure custom domain if needed
- [ ] Test production build

## Key Differences

### Rendering
- **Next.js**: Server components by default (better performance)
- **Vite + React**: Everything is client-side rendered

### File-Based Routing
- **Next.js**: `app/dashboard/page.tsx` → `/dashboard`
- **Vite + React Router**: Manual route configuration needed

### Data Fetching
- **Next.js**: Direct database queries in Server Components
- **Vite + React**: Typically requires API layer

### Deployment
- **Next.js**: One-click deployment on Vercel
- **Electron**: Build installers for each platform

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. Open http://localhost:3000 in your browser

4. Begin migrating features from `src/` to `app/` directory

## Environment Variables

Create a `.env.local` file in the project root for local development:

```bash
# Example
DATABASE_URL=your_database_url
API_SECRET=your_api_key
```

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Tailwind CSS v3 Docs](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## Support

For questions about the migration, refer to:
1. Check Next.js docs for equivalent features
2. Review this migration guide
3. Check the README.md for project setup instructions
