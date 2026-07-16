from backend.app.database.connection import get_connection
from ml.training.model_registry import get_next_version


def activate_model_by_version(version: int, officer_id: int = None):
    conn = get_connection()
    cur = conn.cursor()

    try:
        cur.execute("""
            UPDATE model_registry
            SET is_active = FALSE,
                activation_status = 'INACTIVE'
            WHERE is_active = TRUE OR activation_status = 'ACTIVE'
        """)


        cur.execute("""
            UPDATE model_registry
            SET is_active = TRUE,
                activation_status = 'ACTIVE',
                activated_by = %s,
                activated_at = NOW()
            WHERE model_version = %s
        """, (officer_id, version))

        conn.commit()
        print(
            f"Model v{version} activated safely. All other models deactivated.")

    except Exception as e:
        conn.rollback()
        print(f"Failed to activate model: {e}")
        raise e

    finally:
        cur.close()
        conn.close()


def main():
    version = get_next_version() - 1
    activate_model_by_version(version)


if __name__ == "__main__":
    main()
