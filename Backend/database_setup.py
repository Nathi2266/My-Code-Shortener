import os
import psycopg2
from dotenv import load_dotenv
from psycopg2 import sql

load_dotenv()

def setup_database():
    try:
        # Get admin credentials from environment
        admin_user = os.getenv('PG_ADMIN_USER', 'postgres')
        admin_password = os.getenv('PG_ADMIN_PASSWORD', 'postgres')
        app_user = os.getenv('DB_USER', 'nathii')
        app_password = os.getenv('DB_PASSWORD', '20456')
        db_name = os.getenv('DB_NAME', 'code_shortener')

        # Connect to admin database
        conn = psycopg2.connect(
            dbname='postgres',
            user=admin_user,
            password=admin_password,
            host='localhost'
        )
        conn.autocommit = True
        cursor = conn.cursor()

        # Create database if not exists
        cursor.execute(sql.SQL("SELECT 1 FROM pg_database WHERE datname = %s"), [db_name])
        if not cursor.fetchone():
            cursor.execute(sql.SQL("CREATE DATABASE {}").format(
                sql.Identifier(db_name))
            )
            print(f"Database {db_name} created")

        # Create user if not exists
        cursor.execute("SELECT 1 FROM pg_roles WHERE rolname = %s", [app_user])
        if not cursor.fetchone():
            cursor.execute(sql.SQL("CREATE USER {} WITH PASSWORD %s").format(
                sql.Identifier(app_user)), [app_password]
            )
            print(f"User {app_user} created")

        # Grant privileges
        cursor.execute(sql.SQL("ALTER USER {} WITH CREATEDB").format(
            sql.Identifier(app_user))
        )
        cursor.execute(sql.SQL("GRANT ALL PRIVILEGES ON DATABASE {} TO {}").format(
            sql.Identifier(db_name), 
            sql.Identifier(app_user))
        )

        print("Database setup completed successfully")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    setup_database() 