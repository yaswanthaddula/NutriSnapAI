# PostgreSQL Setup for NutriSnap AI

Follow these steps to set up PostgreSQL and configure the backend.

## 1. Install PostgreSQL
- **Windows**: Download and install from [postgresql.org](https://www.postgresql.org/download/windows/).
- **macOS**: Use Homebrew: `brew install postgresql`.
- **Linux**: Use your package manager, e.g., `sudo apt install postgresql postgresql-contrib`.

## 2. Create Database
Open your terminal or pgAdmin and run the following SQL commands:

```sql
CREATE DATABASE nutrisnap;
```

If you need a specific user:
```sql
CREATE USER username WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE nutrisnap TO username;
```

## 3. Update Environment Variables
Open `backend/.env` and update the database settings:

```env
DB_USER=postgres
DB_PASSWORD=your_actual_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nutrisnap
```

*Replace `username` and `password` with your actual PostgreSQL credentials.*

## 4. Install Dependencies
Run the following command in the `backend` directory:

```bash
pip install -r requirements.txt
```

## 5. Run the Backend
Start the FastAPI server:

```bash
python main.py
```

On startup, the app will automatically create the required tables in your PostgreSQL database.

---
**Note:** The existing SQLite data (`nutrisnap.db`) will not be migrated automatically. You will need to re-register your user or manually migrate data if needed.
