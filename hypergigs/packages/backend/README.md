# Backend Package

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Generate Prisma client:
```bash
npm run db:generate
```

4. Run migrations:
```bash
npm run db:migrate
```

5. Seed database (optional):
```bash
npm run db:seed
```

## Development

```bash
npm run dev
```

## Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Building

```bash
npm run build
```

## Production

```bash
npm start
```
