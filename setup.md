## Post Setup

**Run Backend:**
    - `cd server`
    - `node src/index.js`

**Run Frontend:** 
    - `cd web`
    - `npm run dev`

---

## Conditionally Run

- If adding new dependencies (`package.json` changes)
```
cd server
npm i
cd ..\web
npm i
```

- If updating schema (`schema.prisma` changes)
```
cd server
npx prisma generate
npx prisma migrate dev
```

- Inspect DB
```
cd server
npx prisma studio
```

- Reset DB (dev only)
```
cd server
Remove-Item .\dev.db -Force -ErrorAction SilentlyContinue
Remove-Item .\prisma\migrations -Recurse -Force -ErrorAction SilentlyContinue
npx prisma migrate dev --name init
```

---

## One Time Setup

### Dir Structure

```
mkdir LyriGuesser
cd LyriGuesser
mkdir server
mkdir web
```

### NPM stuff

```
cd server
npm init -y
npm i express cors bcrypt jsonwebtoken nodemailer dotenv react-router-dom
npm i -D prisma@5.22.0
npm i @prisma/client@5.22.0
```

### Prisma
`npx prisma init`

**Set env Variables**

```
(in server/.env)
PORT=8080
DATABASE_URL="file:./dev.db"
JWT_SECRET="dev-change-me"
APP_ORIGIN="http://localhost:5173"
SMTP_HOST="localhost"
SMTP_PORT="1025"
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM="no-reply@emo-pop.game"
```

**Edit Prisma Schema**

```
# RUN AGAIN IF SCHEMA CHANGES
npx prisma generate
npx prisma migrate dev --name init
```

### Backend Files

```
server/src/index.js
server/src/auth.js
server/src/middleware.js
server/src/mailer.js
```

### Front End

```
cd ..\web
npm create vite@latest . -- --template react
    ^ choose React for framework, Javascript for variant, and no to rolldown
npm i
```

in `web/.env` add `VITE_API_URL="http://localhost:8080"`