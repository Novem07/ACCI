# ACCI client

The client is a Vite/React workspace. Use the root [README](../README.md) for SQL Server, environment, authentication, and full-stack setup.

Client-only commands from the repository root:

```powershell
npm run dev --workspace client
npm test --workspace client
npm run lint --workspace client
npm run build --workspace client
```

The development server runs on port 3000 and proxies `/api` to the server on port 5000.
