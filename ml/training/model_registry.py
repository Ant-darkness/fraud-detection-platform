from backend.app.database.connection import get_connection 


def get_next_version():

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT COALESCE(MAX(model_version),0)
        FROM model_registry
        """
    )

    version = cursor.fetchone()[0]

    conn.close()

    return version + 1


def register_model(
    model_name,
    version,
    model_path,
    dataset_size,
    description
):

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        INSERT INTO model_registry(

            model_name,
            model_version,
            model_path,
            dataset_size,
            model_description

        )
        VALUES (%s, %s, %s, %s, %s)
        RETURNING model_id
        """,

        (
            model_name,
            version,
            model_path,
            dataset_size,
            description
        )
    )
    
    model_id = cursor.fetchone()[0]
    conn.commit()
    
    cursor.close()
    conn.close()
    
    return model_id
