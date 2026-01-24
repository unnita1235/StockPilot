# Stock API Documentation

Base URL: `/api/portfolio`
Authentication: Bearer Token (JWT) required for all endpoints.

## 1. Get Portfolio
**Endpoint**: `GET /api/portfolio`
**Description**: Fetches the user's aggregated portfolio with PnL calculations.

**Response**:
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalInvestment": 1500.00,
      "totalValue": 1575.00,
      "totalPnL": 75.00,
      "positionCount": 1
    },
    "positions": [
      {
        "_id": "65b0f...",
        "symbol": "AAPL",
        "quantity": 10,
        "buyPrice": 150,
        "currentPrice": 157.5,
        "totalValue": 1575,
        "pnl": 75
      }
    ]
  },
  "message": "Portfolio retrieved successfully"
}
```

## 2. Add Stock Position
**Endpoint**: `POST /api/portfolio/positions`
**Description**: Adds a new stock position.

**Body**:
```json
{
  "symbol": "TSLA",
  "quantity": 5,
  "buyPrice": 200.50
}
```

**Validation**:
- `symbol`: Uppercase, alphanumeric + dots/hyphens.
- `quantity`: Must be > 0.
- `buyPrice`: Must be >= 0.

**Response**:
```json
{
  "success": true,
  "data": {
    "userId": "65b...",
    "symbol": "TSLA",
    "quantity": 5,
    "buyPrice": 200.5,
    "_id": "65b10...",
    "createdAt": "...",
    "updatedAt": "..."
  },
  "message": "Position added successfully"
}
```

## 3. Update Position
**Endpoint**: `PUT /api/portfolio/positions/:id`
**Description**: Updates quantity or buy price of an existing position.

**Body**:
```json
{
  "quantity": 10
}
```

**Response**:
```json
{
  "success": true,
  "data": { ...updated_position_object },
  "message": "Position updated successfully"
}
```

## 4. Delete Position
**Endpoint**: `DELETE /api/portfolio/positions/:id`
**Description**: Removes a stock position.

**Response**:
```json
{
  "success": true,
  "data": {
    "deleted": true
  },
  "message": "Position deleted successfully"
}
```

## Error Demos
**Negative Quantity**:
```json
{
  "message": [
    "Quantity must be greater than 0"
  ],
  "error": "Bad Request",
  "statusCode": 400
}
```
