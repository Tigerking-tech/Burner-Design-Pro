"""
SQLite-based persistent storage for users, orders, and withdrawals.

Replaces the in-memory dictionaries with file-based SQLite storage,
ensuring data persists across Railway service restarts.
"""
import sqlite3
import json
import os
import uuid
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Optional, Dict, Any

# ========= DB Path & Connection =========

DB_PATH = os.getenv("DB_PATH", str(Path(__file__).parent.parent.parent / "data" / "app.db"))

os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)


def _get_conn() -> sqlite3.Connection:
    """Get a SQLite connection. check_same_thread=False is safe for single-process Railway deployment."""
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


# ========= Initialization =========

def init_db() -> None:
    """Create tables if they don't exist."""
    conn = _get_conn()
    try:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                full_name TEXT,
                is_active INTEGER NOT NULL DEFAULT 1,
                is_admin INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                subscription_tier TEXT NOT NULL DEFAULT 'free',
                subscription_expires_at TEXT,
                hashed_password TEXT NOT NULL,
                creem_customer_id TEXT,
                creem_subscription_id TEXT
            )
        """)

        conn.execute("""
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
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        """)

        conn.execute("""
            CREATE TABLE IF NOT EXISTS withdrawals (
                id TEXT PRIMARY KEY,
                admin_id TEXT NOT NULL,
                admin_email TEXT NOT NULL,
                amount INTEGER NOT NULL,
                currency TEXT NOT NULL DEFAULT 'usd',
                payment_method TEXT NOT NULL DEFAULT 'stripe_transfer',
                status TEXT NOT NULL DEFAULT 'pending',
                notes TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        """)

        conn.commit()
        print(f"[INFO] Database initialized at: {DB_PATH}")
    finally:
        conn.close()


# ========= Helpers =========

def _row_to_user(row: sqlite3.Row) -> Dict[str, Any]:
    """Convert a user row to a dict compatible with the User model."""
    return {
        "id": row["id"],
        "email": row["email"],
        "full_name": row["full_name"],
        "is_active": bool(row["is_active"]),
        "is_admin": bool(row["is_admin"]),
        "created_at": datetime.fromisoformat(row["created_at"]),
        "updated_at": datetime.fromisoformat(row["updated_at"]),
        "subscription_tier": row["subscription_tier"],
        "subscription_expires_at": datetime.fromisoformat(row["subscription_expires_at"]) if row["subscription_expires_at"] else None,
        "creem_customer_id": row["creem_customer_id"],
        "creem_subscription_id": row["creem_subscription_id"],
    }


def _row_to_order(row: sqlite3.Row) -> Dict[str, Any]:
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
        "created_at": datetime.fromisoformat(row["created_at"]),
        "updated_at": datetime.fromisoformat(row["updated_at"]),
    }


def _row_to_withdrawal(row: sqlite3.Row) -> Dict[str, Any]:
    return {
        "id": row["id"],
        "admin_id": row["admin_id"],
        "admin_email": row["admin_email"],
        "amount": row["amount"],
        "currency": row["currency"],
        "payment_method": row["payment_method"],
        "status": row["status"],
        "notes": row["notes"],
        "created_at": datetime.fromisoformat(row["created_at"]),
        "updated_at": datetime.fromisoformat(row["updated_at"]),
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
        conn.execute("""
            INSERT OR REPLACE INTO users 
            (id, email, full_name, is_active, is_admin, created_at, updated_at,
             subscription_tier, subscription_expires_at, hashed_password,
             creem_customer_id, creem_subscription_id)
            VALUES (?, ?, ?, ?, ?, COALESCE((SELECT created_at FROM users WHERE id = ?), ?), ?, ?, ?, ?, ?, ?)
        """, (
            user_id, email.lower(), full_name, 1 if is_active else 0, 1 if is_admin else 0,
            user_id, now.isoformat(), now.isoformat(),
            subscription_tier, subscription_expires_at.isoformat() if subscription_expires_at else None,
            hashed_password, creem_customer_id, creem_subscription_id
        ))
        conn.commit()
    finally:
        conn.close()


def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    conn = _get_conn()
    try:
        row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
        return _row_to_user(row) if row else None
    finally:
        conn.close()


def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    conn = _get_conn()
    try:
        row = conn.execute("SELECT * FROM users WHERE email = ?", (email.lower(),)).fetchone()
        return _row_to_user(row) if row else None
    finally:
        conn.close()


def get_user_password(user_id: str) -> Optional[str]:
    conn = _get_conn()
    try:
        row = conn.execute("SELECT hashed_password FROM users WHERE id = ?", (user_id,)).fetchone()
        return row["hashed_password"] if row else None
    finally:
        conn.close()


def list_users() -> List[Dict[str, Any]]:
    conn = _get_conn()
    try:
        rows = conn.execute("SELECT * FROM users ORDER BY created_at").fetchall()
        return [_row_to_user(r) for r in rows]
    finally:
        conn.close()


def activate_user(user_id: str) -> None:
    conn = _get_conn()
    try:
        now = datetime.utcnow()
        conn.execute("UPDATE users SET is_active = 1, updated_at = ? WHERE id = ?", (now.isoformat(), user_id))
        conn.commit()
    finally:
        conn.close()


def update_user_password(user_id: str, new_hashed_password: str) -> None:
    conn = _get_conn()
    try:
        now = datetime.utcnow()
        conn.execute("UPDATE users SET hashed_password = ?, updated_at = ? WHERE id = ?",
                     (new_hashed_password, now.isoformat(), user_id))
        conn.commit()
    finally:
        conn.close()


def update_user_subscription(user_id: str, tier: Optional[str] = None,
                             expires_at: Optional[datetime] = None,
                             is_active: Optional[bool] = None) -> None:
    conn = _get_conn()
    try:
        now = datetime.utcnow()
        updates, params = [], []
        if tier is not None:
            updates.append("subscription_tier = ?")
            params.append(tier)
        if expires_at is not None:
            updates.append("subscription_expires_at = ?")
            params.append(expires_at.isoformat() if expires_at else None)
        if is_active is not None:
            updates.append("is_active = ?")
            params.append(1 if is_active else 0)
        updates.append("updated_at = ?")
        params.append(now.isoformat())
        params.append(user_id)
        conn.execute(f"UPDATE users SET {', '.join(updates)} WHERE id = ?", params)
        conn.commit()
    finally:
        conn.close()


def update_user_creem(user_id: str, creem_customer_id: Optional[str] = None,
                      creem_subscription_id: Optional[str] = None) -> None:
    conn = _get_conn()
    try:
        now = datetime.utcnow()
        updates, params = [], []
        if creem_customer_id is not None:
            updates.append("creem_customer_id = ?")
            params.append(creem_customer_id)
        if creem_subscription_id is not None:
            updates.append("creem_subscription_id = ?")
            params.append(creem_subscription_id)
        updates.append("updated_at = ?")
        params.append(now.isoformat())
        params.append(user_id)
        conn.execute(f"UPDATE users SET {', '.join(updates)} WHERE id = ?", params)
        conn.commit()
    finally:
        conn.close()


def user_exists(email: str) -> bool:
    conn = _get_conn()
    try:
        row = conn.execute("SELECT id FROM users WHERE email = ?", (email.lower(),)).fetchone()
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
        conn.execute("""
            INSERT OR REPLACE INTO orders (id, user_id, user_email, tier, amount, currency,
             creem_checkout_id, creem_order_id, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE((SELECT created_at FROM orders WHERE id = ?), ?), ?)
        """, (order_id, user_id, user_email, tier, amount, currency,
              creem_checkout_id, creem_order_id, status, order_id, now.isoformat(), now.isoformat()))
        conn.commit()
    finally:
        conn.close()


def get_order(order_id: str) -> Optional[Dict[str, Any]]:
    conn = _get_conn()
    try:
        row = conn.execute("SELECT * FROM orders WHERE id = ?", (order_id,)).fetchone()
        return _row_to_order(row) if row else None
    finally:
        conn.close()


def list_orders() -> List[Dict[str, Any]]:
    conn = _get_conn()
    try:
        rows = conn.execute("SELECT * FROM orders ORDER BY created_at DESC").fetchall()
        return [_row_to_order(r) for r in rows]
    finally:
        conn.close()


def update_order_status(order_id: str, status: str,
                        creem_order_id: Optional[str] = None) -> None:
    conn = _get_conn()
    try:
        now = datetime.utcnow()
        updates, params = ["status = ?", "updated_at = ?"], [status, now.isoformat()]
        if creem_order_id is not None:
            updates.insert(1, "creem_order_id = ?")
            params.insert(1, creem_order_id)
        params.append(order_id)
        conn.execute(f"UPDATE orders SET {', '.join(updates)} WHERE id = ?", params)
        conn.commit()
    finally:
        conn.close()


# ========= Withdrawal Operations =========

def save_withdrawal(withdrawal_id: str, admin_id: str, admin_email: str, amount: int,
                    payment_method: str = "stripe_transfer", status: str = "pending",
                    notes: Optional[str] = None, currency: str = "usd") -> None:
    now = datetime.utcnow()
    conn = _get_conn()
    try:
        conn.execute("""
            INSERT OR REPLACE INTO withdrawals (id, admin_id, admin_email, amount, currency,
             payment_method, status, notes, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, COALESCE((SELECT created_at FROM withdrawals WHERE id = ?), ?), ?)
        """, (withdrawal_id, admin_id, admin_email, amount, currency,
              payment_method, status, notes, withdrawal_id, now.isoformat(), now.isoformat()))
        conn.commit()
    finally:
        conn.close()


def get_withdrawal(withdrawal_id: str) -> Optional[Dict[str, Any]]:
    conn = _get_conn()
    try:
        row = conn.execute("SELECT * FROM withdrawals WHERE id = ?", (withdrawal_id,)).fetchone()
        return _row_to_withdrawal(row) if row else None
    finally:
        conn.close()


def list_withdrawals() -> List[Dict[str, Any]]:
    conn = _get_conn()
    try:
        rows = conn.execute("SELECT * FROM withdrawals ORDER BY created_at DESC").fetchall()
        return [_row_to_withdrawal(r) for r in rows]
    finally:
        conn.close()


def update_withdrawal_status(withdrawal_id: str, status: str) -> None:
    conn = _get_conn()
    try:
        now = datetime.utcnow()
        conn.execute("UPDATE withdrawals SET status = ?, updated_at = ? WHERE id = ?",
                     (status, now.isoformat(), withdrawal_id))
        conn.commit()
    finally:
        conn.close()


# ========= Diagnostics =========

def db_info() -> Dict[str, int]:
    """Return counts for debug/logging purposes."""
    conn = _get_conn()
    try:
        user_count = conn.execute("SELECT COUNT(*) FROM users").fetchone()[0]
        order_count = conn.execute("SELECT COUNT(*) FROM orders").fetchone()[0]
        withdrawal_count = conn.execute("SELECT COUNT(*) FROM withdrawals").fetchone()[0]
        return {
            "users": user_count,
            "orders": order_count,
            "withdrawals": withdrawal_count,
            "db_path": DB_PATH,
        }
    finally:
        conn.close()
