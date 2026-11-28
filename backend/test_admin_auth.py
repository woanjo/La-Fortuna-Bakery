
import json
from getpass import getpass
from http.cookiejar import CookieJar
from urllib.request import Request, build_opener, HTTPCookieProcessor
from urllib.error import HTTPError, URLError

BASE_URL = "http://127.0.0.1:5000"

username = input("Administrator username or email: ").strip()
password = getpass("Administrator password: ")

opener = build_opener(HTTPCookieProcessor(CookieJar()))


def send_request(path, method="GET", payload=None):
    data = None

    if payload is not None:
        data = json.dumps(payload).encode("utf-8")

    request = Request(
        BASE_URL + path,
        data=data,
        method=method,
        headers={"Content-Type": "application/json"}
    )

    try:
        response = opener.open(request)
        return response.status, json.loads(response.read())

    except HTTPError as error:
        return error.code, json.loads(error.read())


try:
    # 1. Test administrator login
    status, result = send_request(
        "/api/auth/admin/login",
        "POST",
        {
            "username": username,
            "password": password,
            "remember_me": False
        }
    )

    print("\nLOGIN:", status, result.get("message"))

    if status != 200:
        raise SystemExit("Login test failed. Check account credentials and role.")

    # 2. Verify authenticated session
    status, result = send_request("/api/auth/me")

    print("SESSION:", status, result.get("message", "Administrator session verified."))

    if status != 200:
        raise SystemExit("Session verification failed.")

    # 3. Test logout
    status, result = send_request(
        "/api/auth/logout",
        "POST",
        {}
    )

    print("LOGOUT:", status, result.get("message"))

    # 4. Confirm the session is no longer authenticated
    status, result = send_request("/api/auth/me")

    print("AFTER LOGOUT:", status)

    if status == 401:
        print("\nALL AUTHENTICATION TESTS PASSED!")

    else:
        print("\nSession was not properly cleared.")

except URLError:
    print("Cannot reach Flask. Check whether app.py is running.")
