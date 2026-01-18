# StockPilot Backend

NestJS backend API with MongoDB, JWT authentication, and REST endpoints.

## Features

- 🔐 **Authentication**: JWT-based auth with Passport.js
- 📊 **Stocks API**: CRUD operations for stock data
- 💼 **Portfolio Management**: Track holdings and transactions
- 👤 **User Management**: User profiles and preferences
- 🛡️ **Validation**: Request validation with class-validator

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run start:dev
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Users
- `GET /api/users` - List users (protected)
- `GET /api/users/:id` - Get user by ID (protected)
- `PUT /api/users/:id` - Update user (protected)
- `DELETE /api/users/:id` - Delete user (protected)

### Stocks
- `GET /api/stocks` - List all stocks
- `GET /api/stocks/:id` - Get stock by ID
- `GET /api/stocks/symbol/:symbol` - Get stock by symbol
- `POST /api/stocks` - Create stock (protected)
- `PUT /api/stocks/:id` - Update stock (protected)
- `DELETE /api/stocks/:id` - Delete stock (protected)

### Portfolio
- `GET /api/portfolio` - Get user portfolio (protected)
- `GET /api/portfolio/value` - Get portfolio value (protected)
- `GET /api/portfolio/transactions` - Get transactions (protected)
- `POST /api/portfolio/holdings` - Add holding (protected)
- `DELETE /api/portfolio/holdings/:symbol` - Remove holding (protected)

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/stockpilot` |
| `JWT_SECRET` | JWT signing secret | Required |
| `PORT` | Server port | `5000` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3000` |

## Scripts

- `npm run start:dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start:prod` - Start production server
- `npm run test` - Run tests
- `npm run lint` - Lint code
