from backend.app.database.connection import get_connection


def start_run(version):

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        INSERT INTO training_runs(
            model_version,
            status
        )
        VALUES(%s,'RUNNING')
        RETURNING run_id
        """,
        (version,)
    )

    run_id = cursor.fetchone()[0]

    conn.commit()

    cursor.close()
    conn.close()

    return run_id


def finish_run(run_id):

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        UPDATE training_runs
        SET
            status='SUCCESS',
            finished_at=CURRENT_TIMESTAMP
        WHERE run_id=%s
        """,
        (run_id,)
    )

    conn.commit()

    cursor.close()
    conn.close()


def fail_run(run_id,message):

    conn=get_connection()
    cursor=conn.cursor()

    cursor.execute(
        """
        UPDATE training_runs
        SET
            status='FAILED',
            finished_at=CURRENT_TIMESTAMP,
            message=%s
        WHERE run_id=%s
        """,
        (message,run_id)
    )

    conn.commit()

    cursor.close()
    conn.close()
