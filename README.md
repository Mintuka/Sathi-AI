# RAG Chat Application

A full-stack ChatGPT-like chat application with authentication, file upload, and AI-powered responses.

## Stack

- **Frontend**: Next.js 16, Tailwind CSS
- **Backend**: FastAPI, SQLAlchemy, JWT authentication
- **Database**: PostgreSQL
- **Infrastructure**: Docker Compose

## Project Structure

```
/backend    - FastAPI REST API (auth, chat, file upload)
/frontend   - Next.js app with ChatGPT-like UI
/docker     - Docker Compose configuration
```

## Quick Start (Docker)

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
cp docker/.env.example docker/.env
# Edit .env files with your secrets, then:
cd docker
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API docs: http://localhost:8000/docs

## Local Development

### 1. Configure environment files

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
cp docker/.env.example docker/.env
```

Set secrets in `backend/.env` (including `DATABASE_URL`), `frontend/.env`, and `docker/.env`. Do not commit `.env` files.

### 2. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Open http://localhost:3000

## Features

- **Authentication**: Sign up, log in, and log out via FastAPI JWT endpoints
- **Chat interface**: ChatGPT-style dark UI with sidebar, conversation history, and message threads
- **File upload**: Attach text/code files to messages; content is included in AI context
- **AI responses**: Set `OPENAI_API_KEY` for real GPT responses, or use built-in demo mode

## API Endpoints

### Auth
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Log in (returns JWT)
- `POST /api/auth/logout` - Log out
- `GET /api/auth/me` - Current user

### Chat
- `GET /api/chat/conversations` - List conversations
- `POST /api/chat/conversations` - Create conversation
- `GET /api/chat/conversations/{id}` - Get conversation with messages
- `DELETE /api/chat/conversations/{id}` - Delete conversation
- `POST /api/chat` - Send message and get AI response

### Files
- `POST /api/files/upload` - Upload file
- `GET /api/files/{id}` - Get file metadata

## Environment Variables

### Backend (`backend/.env`)
| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for JWT tokens |
| `CORS_ORIGINS` | Allowed frontend origins |
| `OPENAI_API_KEY` | Optional OpenAI API key |

### Frontend (`frontend/.env`)
| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API URL |
