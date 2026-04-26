from pathlib import Path
from datetime import datetime
import re
import sqlite3

from typing import Dict, Optional, Tuple

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

BASE_DIR = Path(__file__).resolve().parent
DATABASE_PATH = BASE_DIR / "cozycup.db"
FRONTEND_DIR = BASE_DIR.parent / "frontend"

app = Flask(__name__, static_folder=str(FRONTEND_DIR), static_url_path="")
CORS(app)

EMAIL_REGEX = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


def is_valid_date(value: str) -> bool:
    try:
        datetime.strptime(value, "%Y-%m-%d")
        return True
    except ValueError:
        return False


def is_valid_time(value: str) -> bool:
    try:
        datetime.strptime(value, "%H:%M")
        return True
    except ValueError:
        return False


def normalize_text(value: object) -> str:
    return str(value).strip()


def validate_optional_reservation_fields(payload: dict) -> Tuple[Dict, Optional[str]]:
    updatable_fields = {
        "full_name",
        "email",
        "visit_date",
        "visit_time",
        "guests",
        "notes",
    }

    provided_fields = {key for key in payload.keys() if key in updatable_fields}
    if not provided_fields:
        return {}, "No updatable reservation fields were provided."

    updates: dict = {}

    if "full_name" in provided_fields:
        full_name = normalize_text(payload.get("full_name", ""))
        if not full_name:
            return {}, "full_name is required."
        updates["full_name"] = full_name

    if "email" in provided_fields:
        email = normalize_text(payload.get("email", ""))
        if not EMAIL_REGEX.match(email):
            return {}, "Please provide a valid email address."
        updates["email"] = email

    if "visit_date" in provided_fields:
        visit_date = normalize_text(payload.get("visit_date", ""))
        if not is_valid_date(visit_date):
            return {}, "visit_date must be YYYY-MM-DD."
        updates["visit_date"] = visit_date

    if "visit_time" in provided_fields:
        visit_time = normalize_text(payload.get("visit_time", ""))
        if not is_valid_time(visit_time):
            return {}, "visit_time must be HH:MM (24-hour)."
        updates["visit_time"] = visit_time

    if "guests" in provided_fields:
        try:
            guests = int(payload.get("guests"))
        except (TypeError, ValueError):
            return {}, "guests must be a valid integer."

        if guests < 1 or guests > 20:
            return {}, "guests must be between 1 and 20."
        updates["guests"] = guests

    if "notes" in provided_fields:
        updates["notes"] = normalize_text(payload.get("notes", ""))

    return updates, None


def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn


@app.get("/api/menu")
def get_menu():
    conn = get_db_connection()
    try:
        rows = conn.execute(
            """
            SELECT id, name, description, price_nrs, price_usd, price_eur, category, subcategory
            FROM menu
            ORDER BY CASE category WHEN 'food' THEN 0 ELSE 1 END, subcategory ASC, name ASC
            """
        ).fetchall()

        menu_items = [dict(row) for row in rows]
        return jsonify(menu_items)
    except sqlite3.Error:
        return jsonify({"error": "Unable to load menu at this time."}), 500
    finally:
        conn.close()


@app.get("/")
def index():
    return send_from_directory(FRONTEND_DIR, "index.html")


@app.get("/admin")
def admin_dashboard():
    return send_from_directory(FRONTEND_DIR, "admin.html")


@app.get("/api/reservations")
def get_reservations():
    from_date = request.args.get("from_date")
    to_date = request.args.get("to_date")

    if from_date and not is_valid_date(from_date):
        return jsonify({"error": "from_date must be YYYY-MM-DD."}), 400
    if to_date and not is_valid_date(to_date):
        return jsonify({"error": "to_date must be YYYY-MM-DD."}), 400

    filters = []
    params = []

    if from_date:
        filters.append("visit_date >= ?")
        params.append(from_date)

    if to_date:
        filters.append("visit_date <= ?")
        params.append(to_date)

    where_clause = ""
    if filters:
        where_clause = f"WHERE {' AND '.join(filters)}"

    conn = get_db_connection()
    try:
        rows = conn.execute(
            f"""
            SELECT id, full_name, email, visit_date, visit_time, guests, notes, created_at
            FROM reservations
            {where_clause}
            ORDER BY visit_date ASC, visit_time ASC, id DESC
            """,
            params,
        ).fetchall()
        return jsonify([dict(row) for row in rows])
    except sqlite3.Error:
        return jsonify({"error": "Unable to load reservations at this time."}), 500
    finally:
        conn.close()


@app.get("/<path:path>")
def static_proxy(path: str):
    target = FRONTEND_DIR / path
    if target.exists() and target.is_file():
        return send_from_directory(FRONTEND_DIR, path)
    return jsonify({"error": "Not found"}), 404


@app.post("/api/reservations")
def create_reservation():
    payload = request.get_json(silent=True) or {}

    required_fields = ["full_name", "email", "visit_date", "visit_time", "guests"]
    missing_fields = [field for field in required_fields if not payload.get(field)]
    if missing_fields:
        return (
            jsonify(
                {
                    "error": "Missing required fields",
                    "missing": missing_fields,
                }
            ),
            400,
        )

    if not EMAIL_REGEX.match(str(payload["email"]).strip()):
        return jsonify({"error": "Please provide a valid email address."}), 400
    if not is_valid_date(str(payload["visit_date"])):
        return jsonify({"error": "visit_date must be YYYY-MM-DD."}), 400
    if not is_valid_time(str(payload["visit_time"])):
        return jsonify({"error": "visit_time must be HH:MM (24-hour)."}), 400

    try:
        guests = int(payload["guests"])
    except (TypeError, ValueError):
        return jsonify({"error": "guests must be a valid integer."}), 400

    if guests < 1 or guests > 20:
        return jsonify({"error": "guests must be between 1 and 20."}), 400

    conn = get_db_connection()
    try:
        cursor = conn.execute(
            """
            INSERT INTO reservations (
                full_name,
                email,
                visit_date,
                visit_time,
                guests,
                notes
            )
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                payload["full_name"],
                payload["email"],
                payload["visit_date"],
                payload["visit_time"],
                guests,
                payload.get("notes", ""),
            ),
        )
        conn.commit()
        return (
            jsonify(
                {
                    "message": "Reservation confirmed.",
                    "reservation_id": cursor.lastrowid,
                }
            ),
            201,
        )
    except sqlite3.Error:
        return jsonify({"error": "Unable to create reservation at this time."}), 500
    finally:
        conn.close()


@app.put("/api/reservations/<int:reservation_id>")
def update_reservation(reservation_id: int):
    payload = request.get_json(silent=True) or {}
    updates, validation_error = validate_optional_reservation_fields(payload)

    if validation_error:
        return jsonify({"error": validation_error}), 400

    set_clause = ", ".join(f"{field} = ?" for field in updates.keys())
    params = list(updates.values()) + [reservation_id]

    conn = get_db_connection()
    try:
        cursor = conn.execute(
            f"""
            UPDATE reservations
            SET {set_clause}
            WHERE id = ?
            """,
            params,
        )
        conn.commit()

        if cursor.rowcount == 0:
            return jsonify({"error": "Reservation not found."}), 404

        return jsonify({"message": "Reservation updated successfully."})
    except sqlite3.Error:
        return jsonify({"error": "Unable to update reservation at this time."}), 500
    finally:
        conn.close()


@app.delete("/api/reservations/<int:reservation_id>")
def delete_reservation(reservation_id: int):
    conn = get_db_connection()
    try:
        cursor = conn.execute(
            """
            DELETE FROM reservations
            WHERE id = ?
            """,
            (reservation_id,),
        )
        conn.commit()

        if cursor.rowcount == 0:
            return jsonify({"error": "Reservation not found."}), 404

        return jsonify({"message": "Reservation deleted successfully."})
    except sqlite3.Error:
        return jsonify({"error": "Unable to delete reservation at this time."}), 500
    finally:
        conn.close()


if __name__ == "__main__":
    app.run(debug=True)
