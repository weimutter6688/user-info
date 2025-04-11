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
│   └── .env.example   # Example environment variables
├── frontend/        # Next.js frontend application
│   ├── public/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   └── types/
│   ├── next.config.ts
│   ├── package.json
│   └── ...
├── .gitignore
├── ecosystem.config.js # PM2 config for frontend
└── README.md        # This file
```

## Prerequisites

*   **Python**: Version 3.8 or higher (Miniconda recommended for environment management).
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
       *   **Using Miniconda:** Activate your desired conda environment.
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
       Copy the example environment file `backend/.env.example` to `backend/.env` and modify as needed:
       ```bash
       cp .env.example .env
       ```
       *   **`DATABASE_URL`**: Connection string for your database (defaults to SQLite in the project root).
       *   **`BACKEND_PORT`**: The port the backend server should listen on (defaults to 8001 in `.env.example`). This informs the startup command.
       *   **`SECRET_KEY`**: A secret key used for security purposes. **Generate a strong, unique key for production.**

   d.  **Run the Backend Server:**
       Navigate back to the **project root directory**. The `backend/main.py` loads the `.env` file. Start Uvicorn, specifying the port (ideally matching `BACKEND_PORT` in your `.env`):
       ```bash
       cd ..
       # Ensure the port matches your .env setting (e.g., 8001)
       uvicorn backend.main:app --reload --port 8001
       ```
       The backend API should now be running at `http://127.0.0.1:8001` (or the port you configured).

### 2. Frontend Setup (Next.js)

   a.  **Navigate to the frontend directory:**
       Open a **new terminal window/tab**.
       ```bash
       cd frontend
       ```

   b.  **Install Dependencies:**
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
*   The frontend connects to the backend API (ensure the backend URL and port used in the frontend code match where the backend is running, e.g., `http://127.0.0.1:8001`).

---

## Production Deployment

This section provides a general guide for deploying the application to a production server.

### Frontend (Next.js) with PM2

(Instructions remain the same as before)

1.  **Build the Frontend:**
    ```bash
    cd frontend
    npm run build
    cd ..
    ```
2.  **Install PM2 Globally:**
    ```bash
    npm install pm2 -g
    ```
3.  **Start with PM2:**
    The `ecosystem.config.js` file in the project root is configured to manage the frontend. Run from the project root:
    ```bash
    pm2 start ecosystem.config.js
    ```
    This will start the Next.js production server (using `npm start`) on port 3000 (as defined in `ecosystem.config.js`).
4.  **Manage with PM2:**
    *   `pm2 list`: View status.
    *   `pm2 logs user-info-frontend`: View logs.
    *   `pm2 stop user-info-frontend`: Stop the app.
    *   `pm2 restart user-info-frontend`: Restart the app.
    *   `pm2 delete user-info-frontend`: Remove from PM2 list.

### Backend (FastAPI) with Miniconda, Gunicorn, and systemd

This assumes a Linux server environment.

1.  **Server Preparation:**
    *   Install Miniconda on the server.
    *   Install Git (`sudo apt install git` or `sudo yum install git`).
    *   (Recommended) Install Nginx (`sudo apt install nginx` or `sudo yum install nginx`) as a reverse proxy.

2.  **Deploy Code:**
    *   SSH into your server.
    *   Clone the repository: `git clone <your-repository-url> /path/to/deploy/dir`
    *   Navigate to the directory: `cd /path/to/deploy/dir`

3.  **Create Conda Environment:**
    *   `conda create --name userinfo_prod_env python=3.9 -y` (Adjust Python version if needed)
    *   `conda activate userinfo_prod_env`
    *   `cd backend`
    *   `pip install -r requirements.txt`
    *   `pip install gunicorn` # Install Gunicorn for production serving
    *   `cd ..`

4.  **Configure Backend (`.env` file):**
    *   On the server, create a `.env` file inside the `backend` directory: `nano backend/.env`
    *   Copy the contents from `backend/.env.example` and fill in your **production** values.
    *   **Crucially, ensure this `.env` file is NOT committed to Git.** Add `backend/.env` to your root `.gitignore` file if it's not already covered.
    *   Set `DATABASE_URL` for your production database (PostgreSQL/MySQL recommended).
    *   Set `BACKEND_PORT` (e.g., 8001).
    *   Set `SECRET_KEY` to a strong, random value (e.g., `openssl rand -hex 32`).

5.  **Run with Gunicorn (Managed by systemd):**
    *   Create a systemd service file: `sudo nano /etc/systemd/system/userinfo-backend.service`
    *   Paste the following content, **replacing placeholders**:

        ```ini
        [Unit]
        Description=User Info Backend Service (FastAPI)
        After=network.target

        [Service]
        User=your_deploy_user         # CHANGE: User running the service
        Group=your_deploy_group        # CHANGE: Group for the user
        WorkingDirectory=/path/to/deploy/dir # CHANGE: Project root directory

        # Recommended: Load environment variables from the .env file
        EnvironmentFile=/path/to/deploy/dir/backend/.env # CHANGE: Path to your .env file

        # CHANGE: Ensure path to conda env's gunicorn is correct
        # The --bind port MUST match the port Nginx proxies to (e.g., 8001)
        # It should ideally also match BACKEND_PORT in .env for consistency.
        ExecStart=/path/to/miniconda3/envs/userinfo_prod_env/bin/gunicorn backend.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8001

        Restart=always
        RestartSec=3

        [Install]
        WantedBy=multi-user.target
        ```
        *   **`EnvironmentFile`**: This line tells systemd to load variables from your `.env` file before starting the process. This is generally preferred over relying solely on the application's `load_dotenv()`.
        *   **`ExecStart`**: Find the exact `gunicorn` path using `which gunicorn` (after activating the conda environment). Adjust `-w 4` (worker count) based on server CPU cores. Ensure the `--bind 0.0.0.0:PORT` uses the correct port (e.g., 8001) that Nginx will connect to.

    *   Enable and start the service:
        ```bash
        sudo systemctl daemon-reload
        sudo systemctl enable userinfo-backend.service
        sudo systemctl start userinfo-backend.service
        sudo systemctl status userinfo-backend.service # Check status
        sudo journalctl -u userinfo-backend.service -f # Follow logs
        ```

6.  **(Recommended) Configure Nginx Reverse Proxy:**
    *   Create an Nginx config file: `sudo nano /etc/nginx/sites-available/userinfo-app`
    *   Paste and configure:

        ```nginx
        server {
            listen 80;
            # listen 443 ssl; # Uncomment for HTTPS
            server_name your_domain.com or_server_ip; # CHANGE this

            # SSL Configuration (if using HTTPS)...
            # ssl_certificate /path/to/cert.pem;
            # ssl_certificate_key /path/to/key.pem;

            location /api { # Proxy requests starting with /api to the backend
                # Ensure this port matches the one Gunicorn/Uvicorn is bound to in ExecStart (e.g., 8001)
                proxy_pass http://127.0.0.1:8001;
                proxy_set_header Host $host;
                proxy_set_header X-Real-IP $remote_addr;
                proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                proxy_set_header X-Forwarded-Proto $scheme;
            }

            # Add configuration to serve the frontend if needed,
            # or handle it separately (e.g., via Vercel, Netlify, or PM2 serving static files).
        }
        ```
    *   Enable the site and restart Nginx:
        ```bash
        sudo ln -s /etc/nginx/sites-available/userinfo-app /etc/nginx/sites-enabled/
        sudo nginx -t # Test configuration
        sudo systemctl restart nginx
        ```

Now, your backend configuration is primarily managed via the `.env` file on the server, which is loaded by the systemd service before starting Gunicorn. Nginx proxies requests to the port specified in the Gunicorn startup command.