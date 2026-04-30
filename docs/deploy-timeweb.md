# Deploy to Timeweb Cloud App Platform

Omna is currently a static Next.js export. It does not require backend services or environment variables.

Use these settings:

- Node.js: 22 LTS
- Project directory: `/`
- System dependencies: empty
- Build command: `npm ci && npm run build`
- Build directory: `/out`
- Environment variables: empty
- Start command: empty / not required for static hosting

Do not put `npm ci` into the system dependencies field. That field is for Debian packages installed via `apt-get`.

After deploy, these URLs must return real static files, not HTML:

- `/_next/static/.../*.css`
- `/_next/static/.../*.js`
- `/manifest.webmanifest`
- `/icon.svg`
