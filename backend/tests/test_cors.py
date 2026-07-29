from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_cors_preflight():
    response = client.options(
        "/api/auth/login",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "Authorization,Content-Type",
        },
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:3000"
    assert response.headers.get("access-control-allow-credentials") == "true"

def test_cors_request_with_custom_origin():
    response = client.options(
        "/api/auth/login",
        headers={
            "Origin": "https://my-app.vercel.app",
            "Access-Control-Request-Method": "POST",
        },
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "https://my-app.vercel.app"
    assert response.headers.get("access-control-allow-credentials") == "true"

