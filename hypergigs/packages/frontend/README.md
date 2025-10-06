# Hypergigs Frontend

React 19 + TypeScript + Vite + ShadCN-UI frontend application.

## Tech Stack

- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **ShadCN-UI** - Component library
- **React Router** - Routing
- **React Query** - Data fetching
- **Zustand** - State management
- **Vitest** - Testing framework
- **Testing Library** - Component testing

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm test

# Run tests with UI
npm run test:ui

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── components/       # Reusable components
│   └── ui/          # ShadCN-UI components
├── pages/           # Page components
├── hooks/           # Custom hooks
├── services/        # API services
│   └── api/        # API client functions
├── stores/          # Zustand stores
├── types/           # TypeScript types
├── config/          # Configuration files
├── lib/             # Utility functions
└── tests/           # Test setup
```

## Development

- All new features should be tested
- Use feature branches for development
- Follow the component structure from ShadCN-UI
- Use TypeScript for type safety

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm run test:coverage
```
