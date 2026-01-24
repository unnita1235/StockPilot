# StockPilot Backend Environment Variables

This document lists all required and optional environment variables for the StockPilot backend.

---

## Required Variables

These variables **must** be set. The application will exit with an error if they are missing.

| Variable       | Description                          | Example                                                                 |
|----------------|--------------------------------------|-------------------------------------------------------------------------|
| `MONGODB_URI`  | MongoDB connection string            | `mongodb+srv://user:pass@cluster.mongodb.net/stockpilot?retryWrites=true&w=majority` |
| `JWT_SECRET`   | Secret key for JWT token signing     | `your_secure_random_string_min_32_chars`                               |

### Generating a JWT Secret

```bash
# Linux/macOS
openssl rand -base64 32

# PowerShell (Windows)
[Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

---

## Optional Variables

| Variable        | Description                          | Default                                  |
|-----------------|--------------------------------------|------------------------------------------|
| `PORT`          | Server port                          | `5000`                                   |
| `NODE_ENV`      | Environment mode                     | `development`                            |
| `FRONTEND_URL`  | Frontend URL for CORS                | `http://localhost:3000`                  |

---

## Optional: Third-Party Integrations

| Variable              | Description                    | Example                     |
|-----------------------|--------------------------------|-----------------------------|
| `RESEND_API_KEY`      | Resend.com API key for emails  | `re_xxxxxxxxxxxxx`          |
| `TWILIO_SID`          | Twilio account SID             | `ACxxxxxxxxxxxxxxx`         |
| `TWILIO_AUTH_TOKEN`   | Twilio auth token              | `xxxxxxxxxxxxxxxx`          |
| `TWILIO_PHONE`        | Twilio phone number            | `+1234567890`               |

---

## Example `.env` File

```env
# Required
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/stockpilot?retryWrites=true&w=majority
JWT_SECRET=your_secure_jwt_secret_here_min_32_chars

# Optional
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

> ⚠️ **Never commit your `.env` file to version control.** It is already listed in `.gitignore`.
