import os
from backend.app.database.connection import get_connection
#from ml.inference.predictor import predictor

def reload_active_model():
    from ml.inference.predictor import predictor
    predictor.reload_model()
    return {"message": "Active Model reloaded successfully"}

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
        return cursor.fetchall()
    finally:
        cursor.close()
        conn.close()

def get_active_model():
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT model_id,model_path, model_name, model_version, model_description, dataset_size
            FROM model_registry
            WHERE is_active=TRUE
        """)
        return cursor.fetchone()
    finally:
        cursor.close()
        conn.close()

def activate_model(model_id: int, officer_id: int):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("UPDATE model_registry SET is_active=FALSE, activation_status='ARCHIVED' WHERE is_active=TRUE")
        cursor.execute("""
            UPDATE model_registry
            SET is_active=TRUE, activation_status='ACTIVE', activated_by=%s, activated_at=CURRENT_TIMESTAMP
            WHERE model_id=%s
        """, (officer_id, model_id))
        conn.commit()
        return {"message": "Model activated"}
    finally:
        cursor.close()
        conn.close()

def reject_model(model_id: int):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("UPDATE model_registry SET activation_status='REJECTED' WHERE model_id=%s", (model_id,))
        conn.commit()
        return {"message": "Model rejected"}
    finally:
        cursor.close()
        conn.close()

def delete_model(model_id: int):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT model_path, is_active FROM model_registry WHERE model_id=%s", (model_id,))
        row = cursor.fetchone()
        if not row:
            raise Exception("Model not found")
        path, is_active = row
        if is_active:
            raise Exception("Active model cannot be deleted")
        if os.path.exists(path):
            os.remove(path)
        cursor.execute("DELETE FROM model_registry WHERE model_id=%s", (model_id,))
        conn.commit()
        return {"message": "deleted"}
    finally:
        cursor.close()
        conn.close()

def promote_model(model_id: int, officer_id: int = None):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("UPDATE model_registry SET is_active = FALSE")
        cursor.execute("""
            UPDATE model_registry
            SET is_active = TRUE, activation_status = 'AUTO_ACTIVE', activated_by = %s, activated_at = NOW()
            WHERE model_id = %s
        """, (officer_id, model_id))
        conn.commit()
    finally:
        cursor.close()
        conn.close()

def get_active_model_metrics():
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT mr.model_id, mr.model_version, mm.f1_score, mm.precision_score, mm.recall_score, mm.roc_auc
            FROM model_registry mr
            JOIN metric_registry mm ON mr.model_id = mm.model_id
            WHERE mr.is_active = TRUE
            LIMIT 1
        """)
        row = cursor.fetchone()
        if not row:
            return None
        return {
            "model_id": row[0],
            "version": row[1],
            "f1": row[2],
            "precision": row[3],
            "recall": row[4],
            "roc_auc": row[5]
        }
    finally:
        cursor.close()
        conn.close()

def get_latest_model_metrics():
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT mr.model_id, mr.model_version, mm.f1_score, mm.precision_score, mm.recall_score, mm.roc_auc
            FROM model_registry mr
            JOIN metric_registry mm ON mr.model_id = mm.model_id
            ORDER BY mr.created_at DESC
            LIMIT 1
        """)
        row = cursor.fetchone()
        if not row:
            return None
        return {
            "model_id": row[0],
            "version": row[1],
            "f1": row[2],
            "precision": row[3],
            "recall": row[4],
            "roc_auc": row[5]
        }
    finally:
        cursor.close()
        conn.close()

def is_new_model_better():
    active = get_active_model_metrics()
    latest = get_latest_model_metrics()
    if not latest:
        return False, "No model found"
    if not active:
        return True, "No active model exists"
    better = (
        latest["f1"] >= active["f1"] and
        latest["recall"] >= active["recall"] and
        latest["precision"] >= active["precision"] and
        latest["roc_auc"] >= active["roc_auc"]
    )
    reason = "All metrics improved" if better else "Model not better than active"
    return better, reason
