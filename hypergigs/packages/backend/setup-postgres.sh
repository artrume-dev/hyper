#!/bin/bash

# Script to setup local PostgreSQL for development
# This ensures dev environment matches production (Railway)

echo "🔧 Setting up PostgreSQL for local development"
echo "=============================================="
echo ""

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed"
    echo ""
    echo "Install options:"
    echo "  macOS:   brew install postgresql@14"
    echo "  Ubuntu:  sudo apt-get install postgresql"
    echo "  Windows: Download from https://www.postgresql.org/download/"
    echo ""
    exit 1
fi

echo "✅ PostgreSQL is installed"
echo ""

# Check if PostgreSQL is running
if ! pg_isready &> /dev/null; then
    echo "⚠️  PostgreSQL is not running"
    echo ""
    echo "Start PostgreSQL:"
    echo "  macOS (Homebrew):  brew services start postgresql@14"
    echo "  Linux (systemd):   sudo systemctl start postgresql"
    echo ""
    read -p "Would you like to start PostgreSQL now? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if command -v brew &> /dev/null; then
            brew services start postgresql@14
        else
            echo "Please start PostgreSQL manually"
            exit 1
        fi
    else
        exit 1
    fi
fi

echo "✅ PostgreSQL is running"
echo ""

# Create database if it doesn't exist
DB_NAME="hypergigs_dev"
if psql -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
    echo "✅ Database '$DB_NAME' already exists"
else
    echo "📝 Creating database '$DB_NAME'..."
    createdb $DB_NAME
    echo "✅ Database created"
fi

echo ""
echo "🔧 Updating .env file..."

# Update .env file
ENV_FILE="$(dirname "$0")/.env"
if [ -f "$ENV_FILE" ]; then
    # Backup original .env
    cp "$ENV_FILE" "$ENV_FILE.backup"
    
    # Update DATABASE_URL
    sed -i.bak 's|^DATABASE_URL=.*|DATABASE_URL="postgresql://localhost:5432/hypergigs_dev"|' "$ENV_FILE"
    rm "$ENV_FILE.bak"
    
    echo "✅ .env updated (backup saved as .env.backup)"
else
    echo "❌ .env file not found"
    exit 1
fi

echo ""
echo "🔄 Running Prisma migrations..."
npx prisma migrate deploy

echo ""
echo "✨ Setup complete!"
echo ""
echo "Your local environment now uses PostgreSQL:"
echo "  Database: hypergigs_dev"
echo "  URL: postgresql://localhost:5432/hypergigs_dev"
echo ""
echo "To start development:"
echo "  npm run dev"
echo ""
echo "To view database:"
echo "  npx prisma studio"
echo ""
