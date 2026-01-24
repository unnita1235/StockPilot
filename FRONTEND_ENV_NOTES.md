# Frontend Environment Variables

This project uses **Next.js**.

## API Configuration

The frontend determines the Backend API URL using the following logic (in `src/lib/config.ts`):
1.  **`process.env.NEXT_PUBLIC_API_BASE_URL`**: If set, this takes precedence.
2.  **Default**: `http://localhost:3000/api` (for local development).

### Local Development
- By default, the frontend connects to `http://localhost:3000/api`.
- No configuration is needed if your backend is running on port 3000.
- To override, create `.env.local`:
  ```bash
  NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api
  ```

### Deployment (Vercel, Railway, etc.)
You **MUST** set the `NEXT_PUBLIC_API_BASE_URL` environment variable in your deployment settings.

#### Vercel
1.  Go to your Project Settings > Environment Variables.
2.  Add `NEXT_PUBLIC_API_BASE_URL`.
3.  Value: The full URL of your deployed backend (e.g., `https://stockpilot-backend.up.railway.app/api`).

#### Railway (if deploying frontend there)
1.  Go to the Service Variables.
2.  Add `NEXT_PUBLIC_API_BASE_URL`.
3.  Value: `https://<your-backend-url>/api`.

## WebSockets
The WebSocket URL is automatically derived from `NEXT_PUBLIC_API_BASE_URL` by removing the `/api` suffix.
- You can override this specific behavioral by setting `NEXT_PUBLIC_WS_URL`.
