# Sanctity AI - Comment App

Full-stack application for managing comments with authentication, nested replies, and notifications. Built with NestJS (backend), React (frontend), and PostgreSQL (database).

## Features

- **User Authentication**: Register, login, and JWT-based session management.
- **Nested Comments**: Post, reply, edit, and delete commentsin a threaded structure.
- **Notifications**: Real-time notifications for replies and system events.
- **Health Checks**: API endpoint for service health monitoring.
- **Dockerized**: Easy setup with Docker Compose for all services.

NOTE: USERS CAN EDIT, DELETE AND RESTORE COMMENTS WITHIN A 15-MINUTE WINDOW

## Project Structure

```
Sanctity AI/
  backend/      # NestJS API server
  frontend/     # React client app
  db/           # Database initialization script
  docker-compose.yml
```


---

## Quick Start (with Docker Compose)

1. **Clone the repository:**
   ```sh
   git clone <repo-url>
   cd Sanctity
   ```
2. **Start all services:**
   ```sh
   docker-compose up --build
   ```
   - Backend API: http://localhost:3001
   - Frontend: http://localhost:3000
   - PostgreSQL: localhost:5432

3. **Stop services:**
   ```sh
   docker-compose down
   ```

---

## Environment Variables

See `docker-compose.yml` for all environment variables. Key ones include:
- `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`
- `JWT_SECRET`, `JWT_EXPIRES_IN` (in /backend)
- `VITE_API_URL` (in /frontend)

---
