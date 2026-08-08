import os
import logging
from backend.app.database.connection import get_connection

logger = logging.getLogger("model_service")


def reload_active_model():
    from ml.inference.predictor import predictor
    predictor.reload_model()
    return {"message": "Active Model reloaded successfully in memory"}


def get_models():
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT model_id, model_name, model_version, model_description, dataset_size,
                   activation_status, is_active, created_at
            FROM model_registry
            ORDER BY model_version DESC
        """)
        rows = cursor.fetchall()
        columns = [
            "model_id", "model_name", "model_version", "model_description",
            "dataset_size", "activation_status", "is_active", "created_at"
        ]
        return [dict(zip(columns, row)) for row in rows]
    finally:
        cursor.close()
        conn.close()


def get_active_model():
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT model_id, model_path, model_name, model_version, model_description, dataset_size
            FROM model_registry
            WHERE is_active=TRUE
        """)
        row = cursor.fetchone()
        if not row:
            return None
        columns = ["model_id", "model_path", "model_name",
                   "model_version", "model_description", "dataset_size"]
        return dict(zip(columns, row))
    finally:
        cursor.close()
        conn.close()


def activate_model(model_id: int, officer_id: int):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE model_registry SET is_active=FALSE, activation_status='ARCHIVED' WHERE is_active=TRUE")
        cursor.execute("""
            UPDATE model_registry
            SET is_active=TRUE, activation_status='ACTIVE', activated_by=%s, activated_at=CURRENT_TIMESTAMP
            WHERE model_id=%s
        """, (officer_id, model_id))
        conn.commit()
        return {"message": "Model activated successfully in production"}
    finally:
        cursor.close()
        conn.close()


def reject_model(model_id: int):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE model_registry 
            SET activation_status='REJECTED', is_active=FALSE 
            WHERE model_id=%s
        """, (model_id,))
        conn.commit()
        return {"message": "Model deactivated and set to rejected"}
    finally:
        cursor.close()
        conn.close()


def delete_model(model_id: int):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT model_path, is_active FROM model_registry WHERE model_id=%s", (model_id,))
        row = cursor.fetchone()
        if not row:
            raise Exception("Model not found in registry")

        path, is_active = row
        if is_active:
            raise Exception(
                "Huwezi kufuta model ambayo ipo ACTIVE kwenye uzalishaji! I-deactivate kwanza.")

        if path and os.path.exists(path):
            try:
                os.remove(path)
            except Exception as e:
                logger.warning(
                    f"Imeshindikana kufuta faili kwenye path: {path}. Sababu: {str(e)}")

        cursor.execute(
            "DELETE FROM model_registry WHERE model_id=%s", (model_id,))
        conn.commit()
        return {"message": "Model file and record deleted successfully"}
    finally:
        cursor.close()
        conn.close()
