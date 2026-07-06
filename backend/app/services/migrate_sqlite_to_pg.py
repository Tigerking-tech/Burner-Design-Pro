"""
SQLite to PostgreSQL migration script.
Run this once to migrate data from the old SQLite database to Neon PostgreSQL.

Usage:
    python -m app.services.migrate_sqlite_to_pg

Environment variables required:
    - DATABASE_URL: PostgreSQL connection string (e.g., from Neon)
    - OLD_DB_PATH: Path to the old SQLite database (optional, defaults to /data/app.db)
"""
import os
import sqlite3
from datetime import datetime

# Get environment variables
DATABASE_URL = os.getenv("DATABASE_URL")
OLD_DB_PATH = os.getenv("OLD_DB_PATH", "/data/app.db")

if not DATABASE_URL:
    print("ERROR: DATABASE_URL environment variable is required")
    print("Example: postgresql://user:password@host/database?sslmode=require")
    exit(1)


def connect_sqlite(db_path: str):
    """Connect to SQLite database."""
    if not os.path.exists(db_path):
        print(f"WARNING: Old SQLite database not found at {db_path}")
        print("Skipping migration - no data to migrate")
        return None
    return sqlite3.connect(db_path)


def migrate_users(sqlite_conn, pg_conn):
    """Migrate users from SQLite to PostgreSQL."""
    if sqlite_conn is None:
        return 0
    
    cursor = sqlite_conn.execute("SELECT * FROM users")
    columns = [desc[0] for desc in cursor.description]
    rows = cursor.fetchall()
    
    migrated = 0
    for row in rows:
        user = dict(zip(columns, row))
        
        # Convert SQLite boolean integers to Python bools
        is_active = bool(user.get('is_active', 0))
        is_admin = bool(user.get('is_admin', 0))
        
        pg_conn.execute("""
            INSERT INTO users 
            (id, email, full_name, is_active, is_admin, created_at, updated_at,
             subscription_tier, subscription_expires_at, hashed_password,
             creem_customer_id, creem_subscription_id)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (id) DO UPDATE SET
                email = EXCLUDED.email,
                full_name = EXCLUDED.full_name,
                is_active = EXCLUDED.is_active,
                is_admin = EXCLUDED.is_admin,
                updated_at = EXCLUDED.updated_at,
                subscription_tier = EXCLUDED.subscription_tier,
                subscription_expires_at = EXCLUDED.subscription_expires_at,
                hashed_password = EXCLUDED.hashed_password,
                creem_customer_id = EXCLUDED.creem_customer_id,
                creem_subscription_id = EXCLUDED.creem_subscription_id
        """, (
            user['id'],
            user['email'],
            user.get('full_name'),
            1 if is_active else 0,
            1 if is_admin else 0,
            user.get('created_at'),
            user.get('updated_at'),
            user.get('subscription_tier', 'free'),
            user.get('subscription_expires_at'),
            user['hashed_password'],
            user.get('creem_customer_id'),
            user.get('creem_subscription_id'),
        ))
        migrated += 1
    
    pg_conn.commit()
    return migrated


def migrate_orders(sqlite_conn, pg_conn):
    """Migrate orders from SQLite to PostgreSQL."""
    if sqlite_conn is None:
        return 0
    
    cursor = sqlite_conn.execute("SELECT * FROM orders")
    columns = [desc[0] for desc in cursor.description]
    rows = cursor.fetchall()
    
    migrated = 0
    for row in rows:
        order = dict(zip(columns, row))
        
        pg_conn.execute("""
            INSERT INTO orders 
            (id, user_id, user_email, tier, amount, currency,
             creem_checkout_id, creem_order_id, status, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (id) DO UPDATE SET
                user_id = EXCLUDED.user_id,
                user_email = EXCLUDED.user_email,
                tier = EXCLUDED.tier,
                amount = EXCLUDED.amount,
                currency = EXCLUDED.currency,
                creem_checkout_id = EXCLUDED.creem_checkout_id,
                creem_order_id = EXCLUDED.creem_order_id,
                status = EXCLUDED.status,
                updated_at = EXCLUDED.updated_at
        """, (
            order['id'],
            order['user_id'],
            order['user_email'],
            order['tier'],
            order['amount'],
            order.get('currency', 'usd'),
            order.get('creem_checkout_id'),
            order.get('creem_order_id'),
            order.get('status', 'pending'),
            order.get('created_at'),
            order.get('updated_at'),
        ))
        migrated += 1
    
    pg_conn.commit()
    return migrated


def migrate_withdrawals(sqlite_conn, pg_conn):
    """Migrate withdrawals from SQLite to PostgreSQL."""
    if sqlite_conn is None:
        return 0
    
    cursor = sqlite_conn.execute("SELECT * FROM withdrawals")
    columns = [desc[0] for desc in cursor.description]
    rows = cursor.fetchall()
    
    migrated = 0
    for row in rows:
        withdrawal = dict(zip(columns, row))
        
        pg_conn.execute("""
            INSERT INTO withdrawals 
            (id, admin_id, admin_email, amount, currency,
             payment_method, status, notes, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (id) DO UPDATE SET
                admin_id = EXCLUDED.admin_id,
                admin_email = EXCLUDED.admin_email,
                amount = EXCLUDED.amount,
                currency = EXCLUDED.currency,
                payment_method = EXCLUDED.payment_method,
                status = EXCLUDED.status,
                notes = EXCLUDED.notes,
                updated_at = EXCLUDED.updated_at
        """, (
            withdrawal['id'],
            withdrawal['admin_id'],
            withdrawal['admin_email'],
            withdrawal['amount'],
            withdrawal.get('currency', 'usd'),
            withdrawal.get('payment_method', 'stripe_transfer'),
            withdrawal.get('status', 'pending'),
            withdrawal.get('notes'),
            withdrawal.get('created_at'),
            withdrawal.get('updated_at'),
        ))
        migrated += 1
    
    pg_conn.commit()
    return migrated


def main():
    import psycopg2
    
    print("=" * 50)
    print("SQLite to PostgreSQL Migration")
    print("=" * 50)
    
    # Connect to SQLite (old database)
    sqlite_conn = connect_sqlite(OLD_DB_PATH)
    
    # Connect to PostgreSQL (new database)
    print(f"\nConnecting to PostgreSQL...")
    pg_conn = psycopg2.connect(DATABASE_URL)
    
    # Initialize tables in PostgreSQL
    from app.services.database import init_db
    print("Initializing PostgreSQL tables...")
    init_db()
    
    # Migrate data
    print("\nMigrating data...")
    
    users_count = migrate_users(sqlite_conn, pg_conn)
    print(f"  - Migrated {users_count} users")
    
    orders_count = migrate_orders(sqlite_conn, pg_conn)
    print(f"  - Migrated {orders_count} orders")
    
    withdrawals_count = migrate_withdrawals(sqlite_conn, pg_conn)
    print(f"  - Migrated {withdrawals_count} withdrawals")
    
    # Close connections
    if sqlite_conn:
        sqlite_conn.close()
    pg_conn.close()
    
    print("\n" + "=" * 50)
    print("Migration completed successfully!")
    print("=" * 50)


if __name__ == "__main__":
    main()
