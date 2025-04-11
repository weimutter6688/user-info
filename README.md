# User Information Management System

This project is a simple information recording system built with Next.js for the frontend and FastAPI for the backend API, using SQLite as the database.

## Project Structure

```
/
├── backend/         # FastAPI backend application
│   ├── crud.py
│   ├── database.py
│   ├── main.py
│   ├── models.py
│   ├── schemas.py
│   ├── requirements.txt
│   └── .env.example
├── frontend/        # Next.js frontend application
│   ├── public/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   └── types/
│   ├── next.config.ts
│   ├── package.json
│   └── ...
└── README.md        # This file
```

## Prerequisites

*   **Python**: Version 3.8 or higher. (You mentioned using Miniconda, which manages Python environments).
*   **Node.js**: Version 18.x or higher.
*   **npm**: Comes with Node.js.

## Development Setup & Running

Follow these steps to set up and run the project locally for development.

### 1. Backend Setup (FastAPI)

   a.  **Navigate to the backend directory:**
       ```bash
       cd backend
       ```

   b.  **Set up Python Environment & Install Dependencies:**
       *   **Using Miniconda (as you mentioned):** Activate your desired conda environment. You've already indicated you installed the requirements, but for future reference or other users, the command would typically be:
           ```bash
           # Assuming you have a conda environment named 'myenv'
           conda activate myenv
           pip install -r requirements.txt
           ```
       *   **Using venv (alternative):**
           ```bash
           python3 -m venv venv
           source venv/bin/activate  # On Windows use `venv\Scripts\activate`
           pip install -r requirements.txt
           ```

   c.  **Configure Environment Variables:**
       Copy the example environment file and modify if necessary (though the default SQLite setup should work out-of-the-box):
       ```bash
       cp .env.example .env
       ```
       *Note: The default `DATABASE_URL` uses a relative path `sqlite:///./user_info.db`. When running the server from the project root, this file will be created in the root directory.*

   d.  **Run the Backend Server:**
       Navigate back to the **project root directory** (`/data/user-info-edu` or wherever you cloned the project) and run Uvicorn, specifying the application location and a port (we used 8001 previously to avoid conflicts):
       ```bash
       cd ..
       uvicorn backend.main:app --reload --port 8001
       ```
       *   `backend.main:app`: Tells Uvicorn where to find the FastAPI app instance (`app` inside `backend/main.py`).
       *   `--reload`: Enables auto-reloading when code changes.
       *   `--port 8001`: Runs the server on port 8001 (change if needed).

       The backend API should now be running at `http://127.0.0.1:8001`. The first time it runs (after deleting any old `.db` file), it should create the `user_info.db` SQLite file in the project root.

### 2. Frontend Setup (Next.js)

   a.  **Navigate to the frontend directory:**
       Open a **new terminal window/tab** (leave the backend server running).
       ```bash
       cd frontend
       ```

   b.  **Install Dependencies:**
       If you haven't already or if dependencies are missing:
       ```bash
       npm install
       ```

   c.  **Run the Frontend Development Server:**
       ```bash
       npm run dev
       ```
       The frontend application should now be running, typically at `http://localhost:3000`.

## Accessing the Application

*   Open your web browser and navigate to `http://localhost:3000`.
*   The frontend will connect to the backend API running on `http://127.0.0.1:8001`.

You should now be able to view, add (with basic fields, remarks, dynamic emails/education), and delete users.