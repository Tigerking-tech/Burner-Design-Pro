"""
PostgreSQL-based persistent storage for users, orders, and withdrawals.
Uses DATABASE_URL environment variable for connection.
Compatible with Neon, Render, or any PostgreSQL provider.
"""
import psycopg2
import psycopg2.extras
import os
import uuid
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any

# ========= DB Connection =========

DATABASE_URL = os.getenv("DATABASE_URL", "")


def _get_conn():
    """Get a PostgreSQL connection."""
    if not DATABASE_URL:
        raise ValueError("DATABASE_URL environment variable is required. "
                         "Please set it in your environment variables.")
    return psycopg2.connect(DATABASE_URL, cursor_factory=psycopg2.extras.RealDictCursor)


# ========= Initialization =========

def init_db() -> None:
    """Create tables if they don't exist."""
    conn = _get_conn()
    try:
        cur = conn.cursor()
        cur.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                full_name TEXT,
                is_active INTEGER NOT NULL DEFAULT 1,
                is_admin INTEGER NOT NULL DEFAULT 0,
                created_at TIMESTAMP NOT NULL,
                updated_at TIMESTAMP NOT NULL,
                subscription_tier TEXT NOT NULL DEFAULT 'free',
                subscription_expires_at TIMESTAMP,
                hashed_password TEXT NOT NULL,
                creem_customer_id TEXT,
                creem_subscription_id TEXT
            )
        """)

        cur.execute("""
            CREATE TABLE IF NOT EXISTS orders (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                user_email TEXT NOT NULL,
                tier TEXT NOT NULL,
                amount INTEGER NOT NULL,
                currency TEXT NOT NULL DEFAULT 'usd',
                creem_checkout_id TEXT,
                creem_order_id TEXT,
                status TEXT NOT NULL DEFAULT 'pending',
                created_at TIMESTAMP NOT NULL,
                updated_at TIMESTAMP NOT NULL
            )
        """)

        cur.execute("""
            CREATE TABLE IF NOT EXISTS withdrawals (
                id TEXT PRIMARY KEY,
                admin_id TEXT NOT NULL,
                admin_email TEXT NOT NULL,
                amount INTEGER NOT NULL,
                currency TEXT NOT NULL DEFAULT 'usd',
                payment_method TEXT NOT NULL DEFAULT 'stripe_transfer',
                status TEXT NOT NULL DEFAULT 'pending',
                notes TEXT,
                created_at TIMESTAMP NOT NULL,
                updated_at TIMESTAMP NOT NULL
            )
        """)

        conn.commit()
        cur.close()
        print("[INFO] Database tables initialized")
    finally:
        conn.close()


# ========= Helpers =========

def _row_to_user(row) -> Dict[str, Any]:
    """Convert a user row to a dict compatible with the User model."""
    return {
        "id": row["id"],
        "email": row["email"],
        "full_name": row["full_name"],
        "is_active": bool(row["is_active"]),
        "is_admin": bool(row["is_admin"]),
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
        "subscription_tier": row["subscription_tier"],
        "subscription_expires_at": row["subscription_expires_at"],
        "creem_customer_id": row["creem_customer_id"],
        "creem_subscription_id": row["creem_subscription_id"],
    }


def _row_to_order(row) -> Dict[str, Any]:
    return {
        "id": row["id"],
        "user_id": row["user_id"],
        "user_email": row["user_email"],
        "tier": row["tier"],
        "amount": row["amount"],
        "currency": row["currency"],
        "creem_checkout_id": row["creem_checkout_id"],
        "creem_order_id": row["creem_order_id"],
        "status": row["status"],
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


def _row_to_withdrawal(row) -> Dict[str, Any]:
    return {
        "id": row["id"],
        "admin_id": row["admin_id"],
        "admin_email": row["admin_email"],
        "amount": row["amount"],
        "currency": row["currency"],
        "payment_method": row["payment_method"],
        "status": row["status"],
        "notes": row["notes"],
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


# ========= User Operations =========

def save_user(user_id: str, email: str, hashed_password: str, full_name: Optional[str] = None,
              is_active: bool = False, is_admin: bool = False,
              subscription_tier: str = "free",
              subscription_expires_at: Optional[datetime] = None,
              creem_customer_id: Optional[str] = None,
              creem_subscription_id: Optional[str] = None) -> None:
    """Insert or replace a user."""
    now = datetime.utcnow()
    conn = _get_conn()
    try:
        cur = conn.cursor()
        existing = get_user_by_id(user_id)
        created_at = existing["created_at"] if existing else now
        
        print(f"[DB DEBUG] save_user: email={email}, user_id={user_id}, is_active={is_active}, existing={existing is not None}")
        
        cur.execute("""
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
            user_id, email.lower(), full_name, 1 if is_active else 0, 1 if is_admin else 0,
            created_at, now,
            subscription_tier, subscription_expires_at,
            hashed_password, creem_customer_id, creem_subscription_id
        ))
        conn.commit()
        print(f"[DB DEBUG] save_user: COMMIT successful, rows affected: {cur.rowcount}")
        
        # Verify write
        cur.execute("SELECT COUNT(*) as cnt FROM users WHERE email = %s", (email.lower(),))
        count = cur.fetchone()["cnt"]
        print(f"[DB DEBUG] save_user: Verify - users with email '{email}': {count}")
        
        cur.close()
    except Exception as e:
        print(f"[DB DEBUG] save_user: ERROR - {e}")
        conn.rollback()
        raise
    finally:
        conn.close()


def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    conn = _get_conn()
    try:
        cur = conn.cursor()
        cur.execute("SELECT * FROM users WHERE id = %s", (user_id,))
        row = cur.fetchone()
        cur.close()
        return _row_to_user(row) if row else None
    finally:
        conn.close()


def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    conn = _get_conn()
    try:
        cur = conn.cursor()
        cur.execute("SELECT * FROM users WHERE email = %s", (email.lower(),))
        row = cur.fetchone()
        cur.close()
        return _row_to_user(row) if row else None
    finally:
        conn.close()


def get_user_password(user_id: str) -> Optional[str]:
    conn = _get_conn()
    try:
        cur = conn.cursor()
        cur.execute("SELECT hashed_password FROM users WHERE id = %s", (user_id,))
        row = cur.fetchone()
        cur.close()
        return row["hashed_password"] if row else None
    finally:
        conn.close()


def list_users() -> List[Dict[str, Any]]:
    conn = _get_conn()
    try:
        cur = conn.cursor()
        cur.execute("SELECT * FROM users ORDER BY created_at")
        rows = cur.fetchall()
        cur.close()
        return [_row_to_user(r) for r in rows]
    finally:
        conn.close()


def activate_user(user_id: str) -> None:
    conn = _get_conn()
    try:
        cur = conn.cursor()
        now = datetime.utcnow()
        cur.execute("UPDATE users SET is_active = 1, updated_at = %s WHERE id = %s", (now, user_id))
        conn.commit()
        cur.close()
    finally:
        conn.close()


def update_user_password(user_id: str, new_hashed_password: str) -> None:
    conn = _get_conn()
    try:
        cur = conn.cursor()
        now = datetime.utcnow()
        cur.execute("UPDATE users SET hashed_password = %s, updated_at = %s WHERE id = %s",
                     (new_hashed_password, now, user_id))
        conn.commit()
        cur.close()
    finally:
        conn.close()


def update_user_subscription(user_id: str, tier: Optional[str] = None,
                             expires_at: Optional[datetime] = None,
                             is_active: Optional[bool] = None) -> None:
    conn = _get_conn()
    try:
        cur = conn.cursor()
        now = datetime.utcnow()
        updates, params = [], []
        if tier is not None:
            updates.append("subscription_tier = %s")
            params.append(tier)
        if expires_at is not None:
            updates.append("subscription_expires_at = %s")
            params.append(expires_at)
        if is_active is not None:
            updates.append("is_active = %s")
            params.append(1 if is_active else 0)
        updates.append("updated_at = %s")
        params.append(now)
        params.append(user_id)
        cur.execute(f"UPDATE users SET {', '.join(updates)} WHERE id = %s", params)
        conn.commit()
        cur.close()
    finally:
        conn.close()


def update_user_creem(user_id: str, creem_customer_id: Optional[str] = None,
                      creem_subscription_id: Optional[str] = None) -> None:
    conn = _get_conn()
    try:
        cur = conn.cursor()
        now = datetime.utcnow()
        updates, params = [], []
        if creem_customer_id is not None:
            updates.append("creem_customer_id = %s")
            params.append(creem_customer_id)
        if creem_subscription_id is not None:
            updates.append("creem_subscription_id = %s")
            params.append(creem_subscription_id)
        updates.append("updated_at = %s")
        params.append(now)
        params.append(user_id)
        cur.execute(f"UPDATE users SET {', '.join(updates)} WHERE id = %s", params)
        conn.commit()
        cur.close()
    finally:
        conn.close()


def user_exists(email: str) -> bool:
    conn = _get_conn()
    try:
        cur = conn.cursor()
        cur.execute("SELECT id FROM users WHERE email = %s", (email.lower(),))
        row = cur.fetchone()
        cur.close()
        return row is not None
    finally:
        conn.close()


# ========= Order Operations =========

def save_order(order_id: str, user_id: str, user_email: str, tier: str,
               amount: int, currency: str = "usd",
               creem_checkout_id: Optional[str] = None,
               creem_order_id: Optional[str] = None,
               status: str = "pending") -> None:
    now = datetime.utcnow()
    conn = _get_conn()
    try:
        cur = conn.cursor()
        # Check if order exists to preserve created_at
        existing = get_order(order_id)
        created_at = existing["created_at"] if existing else now
        
        cur.execute("""
            INSERT INTO orders (id, user_id, user_email, tier, amount, currency,
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
        """, (order_id, user_id, user_email, tier, amount, currency,
              creem_checkout_id, creem_order_id, status, created_at, now))
        conn.commit()
        cur.close()
    finally:
        conn.close()


def get_order(order_id: str) -> Optional[Dict[str, Any]]:
    conn = _get_conn()
    try:
        cur = conn.cursor()
        cur.execute("SELECT * FROM orders WHERE id = %s", (order_id,))
        row = cur.fetchone()
        cur.close()
        return _row_to_order(row) if row else None
    finally:
        conn.close()


def list_orders() -> List[Dict[str, Any]]:
    conn = _get_conn()
    try:
        cur = conn.cursor()
        cur.execute("SELECT * FROM orders ORDER BY created_at DESC")
        rows = cur.fetchall()
        cur.close()
        return [_row_to_order(r) for r in rows]
    finally:
        conn.close()


def update_order_status(order_id: str, status: str,
                        creem_order_id: Optional[str] = None) -> None:
    conn = _get_conn()
    try:
        cur = conn.cursor()
        now = datetime.utcnow()
        updates, params = ["status = %s", "updated_at = %s"], [status, now]
        if creem_order_id is not None:
            updates.insert(1, "creem_order_id = %s")
            params.insert(1, creem_order_id)
        params.append(order_id)
        cur.execute(f"UPDATE orders SET {', '.join(updates)} WHERE id = %s", params)
        conn.commit()
        cur.close()
    finally:
        conn.close()


# ========= Withdrawal Operations =========

def save_withdrawal(withdrawal_id: str, admin_id: str, admin_email: str, amount: int,
                    payment_method: str = "stripe_transfer", status: str = "pending",
                    notes: Optional[str] = None, currency: str = "usd") -> None:
    now = datetime.utcnow()
    conn = _get_conn()
    try:
        cur = conn.cursor()
        existing = get_withdrawal(withdrawal_id)
        created_at = existing["created_at"] if existing else now
        
        cur.execute("""
            INSERT INTO withdrawals (id, admin_id, admin_email, amount, currency,
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
        """, (withdrawal_id, admin_id, admin_email, amount, currency,
              payment_method, status, notes, created_at, now))
        conn.commit()
        cur.close()
    finally:
        conn.close()


def get_withdrawal(withdrawal_id: str) -> Optional[Dict[str, Any]]:
    conn = _get_conn()
    try:
        cur = conn.cursor()
        cur.execute("SELECT * FROM withdrawals WHERE id = %s", (withdrawal_id,))
        row = cur.fetchone()
        cur.close()
        return _row_to_withdrawal(row) if row else None
    finally:
        conn.close()


def list_withdrawals() -> List[Dict[str, Any]]:
    conn = _get_conn()
    try:
        cur = conn.cursor()
        cur.execute("SELECT * FROM withdrawals ORDER BY created_at DESC")
        rows = cur.fetchall()
        cur.close()
        return [_row_to_withdrawal(r) for r in rows]
    finally:
        conn.close()


def update_withdrawal_status(withdrawal_id: str, status: str) -> None:
    conn = _get_conn()
    try:
        cur = conn.cursor()
        now = datetime.utcnow()
        cur.execute("UPDATE withdrawals SET status = %s, updated_at = %s WHERE id = %s",
                     (status, now, withdrawal_id))
        conn.commit()
        cur.close()
    finally:
        conn.close()


# ========= Diagnostics =========

def db_info() -> Dict[str, int]:
    """Return counts for debug/logging purposes."""
    conn = _get_conn()
    try:
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM users")
        user_count = cur.fetchone()["count"]
        cur.execute("SELECT COUNT(*) FROM orders")
        order_count = cur.fetchone()["count"]
        cur.execute("SELECT COUNT(*) FROM withdrawals")
        withdrawal_count = cur.fetchone()["count"]
        cur.close()
        return {
            "users": user_count,
            "orders": order_count,
            "withdrawals": withdrawal_count,
            "database": "postgresql",
        }
    finally:
        conn.close()
