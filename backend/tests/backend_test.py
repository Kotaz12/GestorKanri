"""Gestor Kanri backend API tests."""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://kanri-platform.preview.emergentagent.com").rstrip("/")
ADMIN_EMAIL = "admin@kanri.mx"
ADMIN_PASSWORD = "Kanri2026!"


# ---------------- Fixtures ----------------
@pytest.fixture(scope="session")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def access_token(api):
    r = api.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"Login failed: {r.status_code} {r.text}"
    data = r.json()
    assert "access_token" in data and "user" in data
    return data["access_token"]


@pytest.fixture(scope="session")
def auth_headers(access_token):
    return {"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"}


# ---------------- Auth ----------------
class TestAuth:
    def test_login_admin(self, api):
        r = api.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert r.status_code == 200
        d = r.json()
        assert d["user"]["email"] == ADMIN_EMAIL
        assert d["user"]["role"] == "admin"
        assert isinstance(d["access_token"], str) and len(d["access_token"]) > 20
        assert isinstance(d["refresh_token"], str)

    def test_login_invalid(self, api):
        r = api.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": "wrongpass"})
        assert r.status_code in (400, 401)

    def test_me_requires_auth(self):
        # Use a fresh session so cookies from login fixture aren't sent
        r = requests.get(f"{BASE_URL}/api/auth/me")
        assert r.status_code == 401

    def test_me_with_token(self, api, auth_headers):
        r = api.get(f"{BASE_URL}/api/auth/me", headers=auth_headers)
        assert r.status_code == 200
        assert r.json()["email"] == ADMIN_EMAIL

    def test_register_new_user(self, api):
        email = f"test_{uuid.uuid4().hex[:8]}@kanri.mx"
        r = api.post(f"{BASE_URL}/api/auth/register", json={
            "email": email, "password": "TestPass123!", "name": "TEST User"
        })
        assert r.status_code in (200, 201), r.text
        d = r.json()
        assert d["user"]["email"] == email
        assert "access_token" in d

    def test_protected_without_token(self):
        r = requests.get(f"{BASE_URL}/api/procedures")
        assert r.status_code == 401


# ---------------- Procedures ----------------
class TestProcedures:
    def test_list_procedures(self, api, auth_headers):
        r = api.get(f"{BASE_URL}/api/procedures", headers=auth_headers)
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list)
        assert len(items) >= 5, f"Expected at least 5 seeded, got {len(items)}"
        sample = items[0]
        for key in ("id", "client_name", "type_name", "dependency_name", "due_date", "status"):
            assert key in sample, f"Missing '{key}' in procedure: {sample.keys()}"

    def test_stats(self, api, auth_headers):
        r = api.get(f"{BASE_URL}/api/procedures/stats", headers=auth_headers)
        assert r.status_code == 200
        d = r.json()
        for key in ("total", "on_time", "warning", "late", "completed"):
            assert key in d
            assert isinstance(d[key], int)
        assert d["total"] >= 5

    def test_create_procedure_and_verify(self, api, auth_headers):
        # Need a valid client, type, dependency
        clients = api.get(f"{BASE_URL}/api/clients", headers=auth_headers).json()
        types = api.get(f"{BASE_URL}/api/types", headers=auth_headers).json()
        deps = api.get(f"{BASE_URL}/api/dependencies", headers=auth_headers).json()
        assert clients and types and deps

        payload = {
            "title": f"TEST Procedure {uuid.uuid4().hex[:6]}",
            "description": "Created by automated test",
            "client_id": clients[0]["id"],
            "type_id": types[0]["id"],
            "dependency_id": deps[0]["id"],
        }
        r = api.post(f"{BASE_URL}/api/procedures", headers=auth_headers, json=payload)
        assert r.status_code in (200, 201), r.text
        created = r.json()
        assert created["title"] == payload["title"]
        assert created.get("due_date"), "due_date should be auto-calculated"
        pid = created["id"]

        # GET to verify
        r2 = api.get(f"{BASE_URL}/api/procedures/{pid}", headers=auth_headers)
        assert r2.status_code == 200
        assert r2.json()["title"] == payload["title"]

        # Patch status
        r3 = api.patch(f"{BASE_URL}/api/procedures/{pid}/status", headers=auth_headers,
                       json={"status": "completed"})
        assert r3.status_code == 200, r3.text

        r4 = api.get(f"{BASE_URL}/api/procedures/{pid}", headers=auth_headers)
        assert r4.json()["status"] == "completed"

        # Add note + list notes
        rn = api.post(f"{BASE_URL}/api/procedures/{pid}/notes", headers=auth_headers,
                      json={"content": "TEST note"})
        assert rn.status_code in (200, 201), rn.text
        rln = api.get(f"{BASE_URL}/api/procedures/{pid}/notes", headers=auth_headers)
        assert rln.status_code == 200
        notes = rln.json()
        assert any(n.get("content") == "TEST note" for n in notes)


# ---------------- Catalogs CRUD ----------------
class TestClients:
    def test_clients_crud(self, api, auth_headers):
        r = api.get(f"{BASE_URL}/api/clients", headers=auth_headers)
        assert r.status_code == 200
        assert len(r.json()) >= 5

        payload = {"name": f"TEST Client {uuid.uuid4().hex[:6]}", "email": "test@c.mx", "phone": "5555"}
        rc = api.post(f"{BASE_URL}/api/clients", headers=auth_headers, json=payload)
        assert rc.status_code in (200, 201), rc.text
        cid = rc.json()["id"]

        rp = api.put(f"{BASE_URL}/api/clients/{cid}", headers=auth_headers,
                     json={**payload, "name": "TEST Client Updated"})
        assert rp.status_code == 200, rp.text
        assert rp.json()["name"] == "TEST Client Updated"

        rd = api.delete(f"{BASE_URL}/api/clients/{cid}", headers=auth_headers)
        assert rd.status_code in (200, 204)


class TestTypes:
    def test_types_crud(self, api, auth_headers):
        r = api.get(f"{BASE_URL}/api/types", headers=auth_headers)
        assert r.status_code == 200
        assert len(r.json()) >= 6

        payload = {"name": f"TEST Type {uuid.uuid4().hex[:6]}", "response_days": 5, "description": "x"}
        rc = api.post(f"{BASE_URL}/api/types", headers=auth_headers, json=payload)
        assert rc.status_code in (200, 201), rc.text
        tid = rc.json()["id"]
        assert rc.json()["response_days"] == 5

        rp = api.put(f"{BASE_URL}/api/types/{tid}", headers=auth_headers,
                     json={**payload, "response_days": 9})
        assert rp.status_code == 200
        assert rp.json()["response_days"] == 9

        rd = api.delete(f"{BASE_URL}/api/types/{tid}", headers=auth_headers)
        assert rd.status_code in (200, 204)


class TestDependencies:
    def test_dependencies_crud(self, api, auth_headers):
        r = api.get(f"{BASE_URL}/api/dependencies", headers=auth_headers)
        assert r.status_code == 200
        assert len(r.json()) >= 6

        payload = {"name": f"TEST Dep {uuid.uuid4().hex[:6]}", "description": "d"}
        rc = api.post(f"{BASE_URL}/api/dependencies", headers=auth_headers, json=payload)
        assert rc.status_code in (200, 201), rc.text
        did = rc.json()["id"]

        rp = api.put(f"{BASE_URL}/api/dependencies/{did}", headers=auth_headers,
                     json={**payload, "description": "updated"})
        assert rp.status_code == 200

        rd = api.delete(f"{BASE_URL}/api/dependencies/{did}", headers=auth_headers)
        assert rd.status_code in (200, 204)


# ---------------- Notifications ----------------
class TestNotifications:
    def test_list_notifications(self, api, auth_headers):
        r = api.get(f"{BASE_URL}/api/notifications", headers=auth_headers)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_unread_count(self, api, auth_headers):
        r = api.get(f"{BASE_URL}/api/notifications/unread-count", headers=auth_headers)
        assert r.status_code == 200
        d = r.json()
        assert "count" in d or isinstance(d, int) or "unread" in d

    def test_mark_read_flow(self, api, auth_headers):
        r = api.get(f"{BASE_URL}/api/notifications", headers=auth_headers)
        notifs = r.json()
        if not notifs:
            pytest.skip("No notifications to mark read")
        nid = notifs[0]["id"]
        rr = api.post(f"{BASE_URL}/api/notifications/{nid}/read", headers=auth_headers)
        assert rr.status_code in (200, 204)
