from backend.app.database.connection import get_connection
from ml.training.model_registry import get_next_version

def main():
    
    conn = get_connection()
    cursor = conn.cursor()
    
    version = get_next_version() - 1
    
    cursor.execute(
        """
        UPDATE model_registry
        SET is_active=0
        """
    )
    
    cursor.execute(
        """
        UPDATE model_registry
        SET is_active=1
        WHERE model_version=?
        """,
        version
    )
    
    conn.commit()
    
    print(f"Model v{version} activated.....")
