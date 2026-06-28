from backend.app.database.connection import get_connection
from ml.inference.predictor import predictor

def reload_active_model():
    predictor.reload_model()
    
    return {
        "message": "Active Model reloaded Sucessfully.............."
    }

def get_models():

    conn = get_connection()

    try:
        cursor = conn.cursor()

        cursor.execute("""
            SELECT
                model_id,
                model_name,
                model_version,
                model_description,
                dataset_size,
                activation_status,
                is_active,
                created_at
            FROM model_registry
            ORDER BY model_version DESC
        """)

        rows = cursor.fetchall()

        return rows

    finally:
        cursor.close()
        conn.close()


def get_active_model():

    conn = get_connection()

    try:

        cursor = conn.cursor()

        cursor.execute("""
            SELECT
                model_id,
                model_name,
                model_version,
                model_description,
                dataset_size
            FROM model_registry
            WHERE is_active=TRUE
        """)

        return cursor.fetchone()

    finally:
        cursor.close()
        conn.close()


def activate_model(model_id:int, officer_id:int):

    conn = get_connection()

    try:

        cursor = conn.cursor()

        cursor.execute("""
            UPDATE model_registry
            SET
                is_active=FALSE,
                activation_status='ARCHIVED'
            WHERE is_active=TRUE
        """)

        cursor.execute("""
            UPDATE model_registry
            SET
                is_active=TRUE,
                activation_status='ACTIVE',
                activated_by=%s,
                activated_at=CURRENT_TIMESTAMP
            WHERE model_id=%s
        """,(officer_id,model_id))

        conn.commit()

        return {"message":"Model activated"}

    finally:

        cursor.close()
        conn.close()


def reject_model(model_id:int):

    conn=get_connection()

    try:

        cursor=conn.cursor()

        cursor.execute("""
            UPDATE model_registry
            SET activation_status='REJECTED'
            WHERE model_id=%s
        """,(model_id,))

        conn.commit()

        return {"message":"Model rejected"}

    finally:

        cursor.close()
        conn.close()
