# BudgetBuddy

BudgetBuddy is a full-stack personal finance and collaborative budgeting platform built with a React frontend, an Express backend, and MongoDB. It helps users track income and expenses, manage monthly and category-based budgets, collaborate on shared family budgets, and stay on top of notifications, profile preferences, and support requests.

## What This Project Does

BudgetBuddy is designed to solve everyday money-management problems in one place. A user can sign up, log in, set up a budget, log expenses, review spending trends, and manage a profile with preferences such as currency and UI settings. The app also supports family budgeting workflows, including shared plans, member management, invites, and expense approval flows.

## Key Features

- Secure authentication with signup, login, logout, and password recovery.
- Personal profile management with currency and UI preference updates.
- Monthly budgets and category-based budget tracking.
- Expense CRUD operations with spending totals, recent expenses, and trend views.
- Shared family budgeting with plans, members, invitations, and approvals.
- Notifications for user activity and budget-related events.
- Contact us and newsletter subscription endpoints for user engagement.
- Protected routes in the frontend for authenticated dashboard experiences.

## Tech Stack

- Frontend: React 19, Vite, React Router, Axios, Framer Motion, React Hot Toast, ECharts
- Backend: Node.js, Express 5, MongoDB, Mongoose, JWT, bcrypt, cors, dotenv, date-fns
- Tooling: ESLint, Vite build pipeline

## Project Structure

- `backend/` contains the Express API, controllers, routes, middleware, models, and notification utilities.
- `frontend/` contains the React app, reusable components, page views, API helpers, and styles.

## Prerequisites

- Node.js 18+ recommended
- npm
- MongoDB Atlas or a local MongoDB instance

## Setup Instructions

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd BudgetBuddy
```

### 2. Configure the backend

Create a `backend/.env` file with the following values:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
PORT=5000
```

### 3. Install dependencies

Install the backend dependencies:

```bash
cd backend
npm install
```

Install the frontend dependencies:

```bash
cd ../frontend
npm install
```

### 4. Run the backend

From the `backend/` directory:

```bash
node server.js
```

The API runs on `http://localhost:5000` by default.

### 5. Run the frontend

From the `frontend/` directory:

```bash
npm run dev
```

The Vite app runs on `http://localhost:5173` by default.

## Development Notes

- The frontend API layer currently points to `http://localhost:5000/api` in `frontend/src/api/api.js`.
- If you change the backend port or host, update that base URL before running the frontend.
- The backend uses bearer tokens for protected routes.
- Most authenticated pages are guarded by the frontend `ProtectedRoute` wrapper.

## Main Routes

### Frontend pages

- Public: landing page, login, signup, contact us
- Protected: dashboard, settings, budget management, expense management, shared budgeting, notifications

### Backend API groups

- `/api/auth` for authentication
- `/api/user` for profile and preferences
- `/api/categories` for spending categories
- `/api/monthly-budgets` for monthly budget records
- `/api/budgets` for budget items
- `/api/expenses` for expense tracking and analytics
- `/api/family-plans` for shared budget plans
- `/api/family-members` for plan members and invites
- `/api/family-expenses` for shared expense workflows
- `/api/notifications` for notifications
- `/api/contact-us` and `/api/newsletter` for public engagement forms

## Why This Project Stands Out

BudgetBuddy shows full-stack engineering across authentication, CRUD workflows, protected routing, data modeling, and collaboration features. It demonstrates an ability to connect a modern React UI to a REST API, manage JWT-based authentication, structure a MongoDB-backed backend, and build a product that goes beyond a simple to-do or demo app.


## License

No license has been specified yet.