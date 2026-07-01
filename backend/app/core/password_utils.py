import random
import string
import re


SPECIAL = "!@#$%&*"


def generate_temporary_password(length: int = 12):

    while True:

        password = "".join(

            random.choice(

                string.ascii_letters +
                string.digits +
                SPECIAL

            )

            for _ in range(length)

        )

        if validate_password_strength(password):

            return password


def validate_password_strength(password: str):

    if len(password) < 8:
        return False

    if not re.search(r"[A-Z]", password):
        return False

    if not re.search(r"[a-z]", password):
        return False

    if not re.search(r"\d", password):
        return False

    if not re.search(r"[!@#$%&*]", password):
        return False

    return True
