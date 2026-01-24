# Stock Tracking API Documentation

Base URL: `/api/portfolio`

Authentication: All endpoints require a valid JWT token in the `Authorization` header (`Bearer <token>`).

## Data Model: Position

```json
{
  "_id": "65b1...",
  "userId": "65b1...",
  "symbol": "AAPL",
  "quantity": 10,
  "buyPrice": 150.50,
  "createdAt": "2024-01-24T...",
  "updatedAt": "2024-01-24T..."
}
```

---

## Endpoints

### 1. Get Portfolio Summary
Fetches all positions and calculates aggregated Profit & Loss.

- **URL**: `GET /api/portfolio`
- **Auth**: Required
- **Response**: `200 OK`

```json
{
  "summary": {
    "totalInvestment": 1505.00,
    "totalValue": 1580.25,
    "totalPnL": 75.25,
    "positionCount": 1
  },
  "positions": [
    {
      "_id": "65b1...",
      "symbol": "AAPL",
      "quantity": 10,
      "buyPrice": 150.50,
      "currentPrice": 158.03, // Mocked value
      "totalValue": 1580.30,
      "pnl": 75.30
    }
  ]
}
```

### 2. Add Stock Position
Adds a new stock position.

- **URL**: `POST /api/portfolio/positions`
- **Auth**: Required
- **Body**:
  - `symbol` (string, required): Stock ticker (e.g., "AAPL"). Automatically uppercased.
  - `quantity` (number, required): Must be > 0.
  - `buyPrice` (number, required): Must be >= 0.

```json
{
  "symbol": "GOOGL",
  "quantity": 5,
  "buyPrice": 140
}
```

- **Response**: `201 Created` returns the created Position object.
- **Errors**: `400 Bad Request` if validation fails (e.g., negative quantity).

### 3. Update Position
Updates quantity or buy price of an existing position.

- **URL**: `PUT /api/portfolio/positions/:id`
- **Auth**: Required
- **Body**: (Partial, at least one field)
  - `quantity` (number, optional)
  - `buyPrice` (number, optional)
  - `symbol` (string, optional)

```json
{
  "quantity": 15
}
```

- **Response**: `200 OK` returns updated Position.
- **Errors**: `404 Not Found` if ID doesn't exist or belongs to another user.

### 4. Delete Position
Removes a position.

- **URL**: `DELETE /api/portfolio/positions/:id`
- **Auth**: Required
- **Response**: `200 OK`

```json
{
  "deleted": true
}
```

- **Errors**: `404 Not Found`
