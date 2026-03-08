import sqlite3

def init_db():
    with sqlite3.connect('casino.db') as conn:
        conn.execute('DROP TABLE IF EXISTS users')
        conn.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                email TEXT NOT NULL,
                date_of_birth TEXT NOT NULL,
                billing_address TEXT NOT NULL,
                balance REAL DEFAULT 0.0,
                totp_secret TEXT,
                last_bonus_claim TEXT DEFAULT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        print("Database initialized successfully.")

if __name__ == "__main__":
    init_db()
