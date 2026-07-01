from backend.app.services.officer_service import create_officer

def main():

    result = create_officer(
        full_name="System Administrator",
        username="admin2",
        email="admin@bot.go.tz",
        role="ADMIN"
    )

    print("=" * 50)
    print("ADMIN ACCOUNT CREATED")
    print("=" * 50)
    print("email :", result["email"])
    print("username :", result["username"])
    print("Password :", result["temporary_password"])
    print("=" * 50)


if __name__ == "__main__":
    main()
