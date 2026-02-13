from fastapi.testclient import TestClient
from app.main import app
import pytest

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"

def test_api_v1_auth_routes_exist():
    # Attempt login without credentials -> 422 Validation Error
    response = client.post("/api/v1/auth/login", json={})
    assert response.status_code == 422 

def test_routes_protected_unauthorized():
    """Verify that protected routes return 401 when no token is provided"""
    protected_endpoints = [
        # ("/api/v1/organizacoes/", "GET"), # Admin only
        ("/api/v1/questionarios/", "GET"), # Active user
        ("/api/v1/diagnosticos/me", "GET"), # Active user
    ]
    
    for endpoint, method in protected_endpoints:
        if method == "GET":
            response = client.get(endpoint)
        elif method == "POST":
            response = client.post(endpoint, json={})
            
        # Should be 401 Unauthorized
        assert response.status_code == 401, f"Endpoint {endpoint} should be protected"

def test_cors_headers():
    # Preflight request
    headers = {
        "Origin": "http://localhost:3000",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "Content-Type",
    }
    response = client.options("/api/v1/auth/login", headers=headers)
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:3000"
