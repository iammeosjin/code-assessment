# 🎂 Birthday Notification Service

This service sends **“Happy birthday”** messages at **9:00 AM in each user's local timezone**.

It is composed of two separate running processes:

- **API Server** — handles user creation and deletion
- **Scheduler Worker** — finds and sends birthday messages when due

Both processes run from the same codebase.

---

## Requirements

- Node.js (18+ recommended)
- pnpm
- MongoDB
- (Optional) Docker + Docker Compose

---

## Environment Setup

Create a `.env.local` file in the project root:

```
MONGODB_URI=mongodb://mongo:27017/boomering
REQUEST_BIN_API_URL=https://hookbin.com/your-endpoint
PORT=3000
MESSAGE_SCHEDULE_TIME=9
```

Make sure these match what your configuration service expects.

---

## Running the Application

### Option A — Docker (recommended)

```
docker compose up --build
```

This starts:

- `api` — API HTTP server (http://localhost:3000)
- `job` — The scheduler worker
- `mongo` — MongoDB instance

---

### Option B — Local (no Docker)

1. Install dependencies:

```
pnpm install
```

2. Run test:

```
pnpm nx test user
```

3. Start API Server:

```
pnpm nx start:api user
```

4. Start Scheduler Worker:

```
pnpm nx start:job user
```

> Both must be running at the same time.

---

## API Usage

### Create User

```
POST /user
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "1997-10-03",
  "location": "Asia/Manila"
}
```

### Delete User

```
DELETE /user/<id>
```

---

## How It Works

1. On user creation:
   - Next birthday is calculated for **9:00 AM** local time.
   - A job is created with scheduled UTC timestamp.

2. Scheduler:
   - Periodically checks for due jobs.
   - Sends message:
     ```
     Hey, <full_name> it’s your birthday
     ```
   - Marks job as done.
   - Schedules next year automatically.

3. If offline:
   - Scheduler will process overdue jobs on restart.

---

## Running Tests

```
pnpm nx test user
```

HTTP calls are mocked using Undici MockAgent.

---

## Troubleshooting

| Problem                              | Solution                                              |
| ------------------------------------ | ----------------------------------------------------- |
| API can't connect to Mongo in Docker | Use `mongodb://mongo:27017/...` instead of localhost  |
| Scheduler does nothing               | Ensure worker is running: `pnpm nx start:job user`    |
| Tests fail due to fetch              | Ensure MockAgent correctly intercepts request         |
| pnpm install fails in Docker         | Add `ENV CI=true` and `corepack enable` to Dockerfile |

---
