from backend.app.database.connection import get_connection
from ml.training.model_registry import get_next_version


def main():

    conn = get_connection()
    cursor = conn.cursor()

    version = get_next_version() - 1

    cursor.execute(
        """
        UPDATE model_registry
        SET is_active=FALSE
        """
    )

    cursor.execute(
        """
        UPDATE model_registry
        SET is_active=TRUE
        WHERE model_version=%s
        
        """,
        (version,)
    )

    conn.commit()
    cursor.close()
    conn.close()

    print(f"Model v{version} activated.....")

main()
