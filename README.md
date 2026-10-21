# Wzk.io — Who Ze Klik

This folder is only the Wzk.io SaaS. One public link hands each visitor to the next WhatsApp number. The chat stays on that phone.

## Run (two PowerShell windows)

```powershell
cd C:\Users\Almog\Documents\lets\wzk
copy .env.example .env
npm install
npm run db:dev
```

Second window:

```powershell
cd C:\Users\Almog\Documents\lets\wzk
npx prisma db push
npm run dev
```

Open http://localhost:3000. Local Postgres listens on port 5433.

## Put it online

This folder is its own git repo. Point a host at it with Node 20+, set `DATABASE_URL` to a real Postgres database, set `AUTH_SECRET`, and set `NEXT_PUBLIC_APP_URL` to the public origin (invite links use it). Then `npx prisma db push` and `npm run build && npm start`. The app listens on port 3000.
