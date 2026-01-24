# Authentication API Routes

The StockPilot backend uses JWT (JSON Web Tokens) for authentication.

**Base URL:** `/api/auth`

## 1. Register User

Create a new user account.

- **Endpoint:** `POST /api/auth/register`
- **Access:** Public

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "strongpassword123",
  "name": "John Doe"
}
```

- `email`: Valid email address (required)
- `password`: String, min 6 chars (required)
- `name`: String, min 2 chars (required)

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "65b0f...",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "staff",
      "isActive": true
    },
    "token": "eyJhbGciOiJIUzI1NiIsIn..."
  },
  "message": "Registration successful"
}
```

## 2. Login User

Authenticate and receive a JWT token.

- **Endpoint:** `POST /api/auth/login`
- **Access:** Public

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "strongpassword123"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "user": { ... },
    "token": "eyJhbGciOiJIUzI1NiIsIn..."
  },
  "message": "Login successful"
}
```

## 3. Get Current User Profile

Get the profile of the currently logged-in user.

- **Endpoint:** `GET /api/auth/me`
- **Access:** Private (Requires Token)

**Headers:**
`Authorization: Bearer <token>`

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "65b0f...",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "staff",
      ...
    }
  }
}
```

## Error Handling

The API returns standard HTTP status codes:

- **400 Bad Request:** Validation failed (e.g., duplicate email, weak password).
- **401 Unauthorized:** Invalid credentials or missing/expired token.
- **403 Forbidden:** Valid token but insufficient permissions (e.g., non-admin accessing admin routes).
- **404 Not Found:** User not found.

**Example Error Response:**

```json
{
  "message": "User already exists",
  "error": "Conflict",
  "statusCode": 409
}
```
