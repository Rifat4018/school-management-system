# School Management System

A full-stack school management web app with three roles: **admin**, **teacher** and **student**.

| Layer | Technology |
| --- | --- |
| Frontend | React 18, Vite, React Router 6, Axios, Context API, plain CSS |
| Backend | Node.js, Express 4 (REST API) |
| Database | MongoDB with Mongoose |
| Auth and security | JWT, bcrypt password hashing, role-based access control, Helmet, CORS, login rate limiting |

## Features

- **Login** with JWT; each role sees a different menu and different data.
- **Admin**: manage students, teachers, classes, subjects, fees and notices (create, edit, delete, search, filter, pagination).
- **Teacher**: view students, mark daily attendance, enter exam marks, post notices.
- **Student**: view own attendance, report card (grade and GPA), fees and notices.
- **Dashboard** with totals, fees collected/pending, today's attendance and students per class (MongoDB aggregation).

## Run it locally

You need **Node.js 18.11 or newer** and **MongoDB** (either MongoDB Community Server on your PC, or a free MongoDB Atlas cluster).

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env        # Windows: copy .env.example .env
npm run seed                # creates demo data (deletes existing data in that database)
npm run dev                 # http://localhost:4000
```

If you use Atlas, put your connection string in `MONGO_URI` inside `.env`.
Check that it works: open <http://localhost:4000/api/health>.

### 2. Frontend (in a second terminal)

```bash
cd frontend
npm install
npm run dev                 # http://localhost:5173
```

### Demo logins (created by the seed script)

| Role | Email | Password |
| --- | --- | --- |
| Admin | admin@school.com | admin123 |
| Teacher | farhana@school.com | teacher123 |
| Student | student1@school.com | student123 |

## Project structure

```
backend/src
  server.js              entry point: env -> connect DB -> listen
  app.js                 Express app: middleware, routes, error handler
  config/db.js           MongoDB connection
  models/                Mongoose schemas (User, Student, Teacher, Class, Subject, Attendance, Result, Fee, Notice)
  controllers/           request handlers (business logic)
  routes/index.js        every endpoint and which role may call it
  middleware/auth.js     protect (JWT check) and authorize (role check)
  middleware/error.js    404 + central error handler
  utils/                 asyncHandler, ApiError, crudFactory, helpers, scope
  seed.js                demo data

frontend/src
  main.jsx, App.jsx      app entry and route definitions
  routes.jsx             page list shared by the router and the sidebar
  api/client.js          Axios instance + interceptors (attach token, handle 401)
  context/AuthContext    global login state (Context API)
  components/            Layout, ProtectedRoute, CrudPage, Modal, ReportCard
  pages/                 Login, Dashboard, Students, Teachers, Classes, Subjects, Attendance, Results, Fees, Notices
  hooks/useOptions.js    custom hook that loads dropdown options
```

## API overview

All routes start with `/api`. Everything except login needs the header `Authorization: Bearer <token>`.

| Method and path | Who | What |
| --- | --- | --- |
| POST `/auth/login` | public | returns `{ token, user }` |
| GET `/auth/me`, PUT `/auth/password` | any user | profile, change password |
| GET `/dashboard` | any user | statistics for the user's role |
| GET `/students`, GET `/students/:id` | admin, teacher | list (`?page&limit&search&class`), detail |
| POST / PUT / DELETE `/students` | admin | create, update, delete |
| GET `/students/me` | student | own profile |
| `/teachers`, `/classes`, `/subjects` | read: admin, teacher; write: admin | CRUD |
| GET `/attendance?class&date` | admin, teacher | class register for one day |
| POST `/attendance` | admin, teacher | save a whole class (upsert) |
| GET `/attendance/student/:id` | staff, or student with `me` | history and percentage |
| GET `/results?subject&exam`, POST `/results` | admin, teacher | marks sheet, save marks |
| GET `/results/student/:id` | staff, or student with `me` | report card with grade and GPA |
| `/fees`, PATCH `/fees/:id/pay` | admin (students read their own) | fees CRUD, mark paid |
| `/notices` | read: all; create: admin, teacher; edit/delete: admin | notices |

Response shape: `{ success, data, pagination? }` on success, `{ success: false, message }` on error.

## Deploying

- Database: MongoDB Atlas (free tier).
- Backend: Render or Railway. Set `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL` (your frontend URL) and `NODE_ENV=production`.
- Frontend: Vercel or Netlify. Set `VITE_API_URL` to `https://your-api-domain/api`, build with `npm run build`.

## Possible improvements

Refresh tokens in httpOnly cookies, MongoDB transactions for multi-document writes, teachers limited to their own classes,
request validation with Zod/Joi, automated tests (Jest + Supertest, React Testing Library), file upload for student photos,
PDF report cards, Docker Compose.
