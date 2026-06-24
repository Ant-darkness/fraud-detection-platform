import pyodbc


def get_connection():

    return pyodbc.connect(
        "DRIVER={ODBC Driver 18 for SQL Server};"
        "SERVER=localhost,1455;"
        "DATABASE=FraudDB;"
        "UID=sa;"
        "PWD=Fraud@2026;"
        "Encrypt=no;"
        "TrustServerCertificate=yes;"
    )
