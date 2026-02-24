# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

### Deploy with Easypanel (self-hosted)

This repo is a monorepo with `frontend/` and `backend/`. Create **three** App Services in Easypanel (or use the same repo with different build contexts):

| Service          | Build context | Dockerfile              | Port | Domain example        |
|------------------|---------------|-------------------------|------|------------------------|
| **PostgreSQL**   | —             | Use Easypanel PostgreSQL service | 5432 | —                      |
| **ctcf-api**     | `backend/`    | `backend/Dockerfile`    | 3001 | `api.ctcf.example.com` |
| **ctcf-frontend**| `frontend/`   | `frontend/Dockerfile`   | 80   | `app.ctcf.example.com` |

**ctcf-api** — Environment variables:

- `DATABASE_URL` — PostgreSQL connection string (Easypanel DB or external).
- `JWT_SECRET` — Secret for JWT signing.
- `CORS_ORIGIN` — Allowed origin (e.g. `https://app.ctcf.example.com`).

After first deploy, run migrations and seed from the api container (or a one-off):

- `npx prisma migrate deploy`
- `npx prisma db seed`

**ctcf-frontend** — Build argument (at build time):

- `VITE_API_BASE_URL` — Backend API URL (e.g. `https://api.ctcf.example.com`).

Frontend build: `docker build --build-arg VITE_API_BASE_URL=https://api.ctcf.example.com -f frontend/Dockerfile frontend/`

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
