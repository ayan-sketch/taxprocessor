# Tax Processor

A professional tax processing and management system built with Next.js and TypeScript.

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm, yarn, or pnpm

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

### Development

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Build

Build for production:
```bash
npm run build
npm start
```

### Type Checking

Run TypeScript type checking:
```bash
npm run type-check
```

## Project Structure

```
├── app/
│   ├── layout.tsx          # Root layout component
│   ├── page.tsx            # Home page
│   └── globals.css         # Global styles with Tailwind
├── components/             # Reusable React components
├── public/                 # Static assets
├── src/                    # Legacy source files (can be migrated)
├── tailwind.config.ts      # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
└── next.config.ts          # Next.js configuration
```

## Technologies

- **Framework**: Next.js 14+
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Lucide React, Framer Motion
- **Data Processing**: ExcelJS, XLSX, PDF.js
- **Charts**: Chart.js, React ChartJS 2

## Deployment

### Vercel

The project is configured for deployment on Vercel. Push to your GitHub repository and connect it to Vercel for automatic deployments.

```bash
# Build command (handled by Vercel)
npm run build

# Start command (handled by Vercel)
npm start
```

## Environment Variables

Create a `.env.local` file for local development:

```env
# Add your environment variables here
```

See `.env.example` for available variables.

## Performance

- Server-side rendering enabled
- Automatic code splitting
- Image optimization
- CSS optimization via Tailwind

## License

Private - All rights reserved
