# Professional Chat Application

A full-stack chat application with RAG (Retrieval-Augmented Generation) capabilities, built with FastAPI backend and React frontend.

## Features

* User authentication with JWT tokens
* Real-time chat using WebSockets
* File upload and processing (PDF, DOCX, TXT)
* Vector-based document search using FAISS
* RAG-powered responses using OpenAI GPT
* Session management with chat history
* Dark/Light theme support
* Responsive UI with modern design

## Tech Stack

### Backend

* FastAPI - Web framework
* MongoDB - Database
* Motor - Async MongoDB driver
* LangChain - LLM framework
* FAISS - Vector similarity search
* OpenAI API - Language model
* JWT - Authentication
* WebSockets - Real-time communication

### Frontend

* React 18
* TypeScript
* Vite - Build tool
* Axios - HTTP client
* Custom CSS with CSS variables for theming

## Prerequisites

Before installation, ensure you have:

* Python 3.9 or higher
* Node.js 16 or higher
* MongoDB (local or cloud instance)
* OpenAI API key

## Installation

### 1. Clone the Repository

bash

```bash
git clone <repository-url>
cd into your directory
```

### 2. Backend Setup

#### Navigate to backend directory

bash

```bash
cd backend
```

#### Create virtual environment

bash

```bash
python -m venv venv

# On Windows
venv\Scripts\activate

# On macOS/Linux
source venv/bin/activate
```

#### Install dependencies

bash

```bash
pip install -r requirements.txt
```

#### Create environment file

Create a `.env` file in the `backend` directory:

env

```env
# Server Configuration
HOST=0.0.0.0
PORT=8001
DEBUG=True

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=chat_app

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4

# JWT Configuration
JWT_SECRET_KEY=your_super_secret_jwt_key_change_this_in_production
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24

# Vector Store Configuration
FAISS_INDEX_PATH=./vector_store/faiss_index
EMBEDDING_MODEL=text-embedding-3-large
CHUNK_SIZE=1000
CHUNK_OVERLAP=200

# CORS Configuration
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

#### Generate JWT Secret Key

You can generate a secure secret key using:

bash

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Replace `your_super_secret_jwt_key_change_this_in_production` with the generated key.

#### Create required directories

bash

```bash
mkdir -p vector_store/faiss_index
```

### 3. Frontend Setup

#### Navigate to frontend directory

bash

```bash
cd../frontend
```

#### Install dependencies

bash

```bash
npminstall
```

#### Create environment file

Create a `.env` file in the `frontend` directory:

env

```env
VITE_API_URL=http://localhost:8001
VITE_WS_URL=ws://localhost:8001
```

### 4. MongoDB Setup

#### Option A: Local MongoDB

Install MongoDB locally and start the service:

bash

```bash
# On macOS with Homebrew
brew services start mongodb-community

# On Ubuntu
sudo systemctl start mongod

# On Windows
# Start MongoDB service from Services
```

#### Option B: MongoDB Atlas (Cloud)

1. Create account at [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Get connection string
4. Update `MONGODB_URI` in backend `.env` file:

env

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
```

## Running the Application

### Start Backend Server

bash

```bash
cd backend
# Make sure virtual environment is activated
python run.py
```

The backend server will start at `http://localhost:8001`

### Start Frontend Development Server

Open a new terminal:

bash

```bash
cd frontend
npm run dev
```

The frontend will start at `http://localhost:5173`

### Verify Installation

1. Open browser and navigate to `http://localhost:5173`
2. You should see the login page
3. Backend API health check: `http://localhost:8001/health`
4. Backend API docs: `http://localhost:8001/docs`
