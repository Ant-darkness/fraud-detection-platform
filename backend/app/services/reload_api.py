import requests

def main():
    
    response = requests.post(
        "http://fraud-api:8000/model/reload",
        timeout=30
    )
    
    response.raise_for_status()
    
    print(response.json())
