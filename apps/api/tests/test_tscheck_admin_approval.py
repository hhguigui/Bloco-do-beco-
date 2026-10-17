"""Criterion: Administrador precisa aprovar o artista.

A pending talent created by an artist is invisible in public listings and to other
users, visible to its owner, cannot have its own status changed by the owner, and
becomes publicly visible only after an admin PATCHes status -> approved.
"""

import uuid

from tests.test_tscheck_oauth_signup import talent_payload


def _create_pending(client, artist_session, name):
    r = client.post("/talents", json=talent_payload(name), headers={"Authorization": f"Bearer {artist_session['token']}"})
    assert r.status_code == 201, r.text
    return r.json()


def test_pending_talent_hidden_until_admin_approves(client, artist_session, admin_client):
    name = f"tscheck-approval-{uuid.uuid4().hex[:8]}"
    talent = _create_pending(client, artist_session, name)
    tid = talent["id"]
    owner_headers = {"Authorization": f"Bearer {artist_session['token']}"}

    try:
        # absent from public list
        r = client.get("/talents")
        assert r.status_code == 200
        assert all(t["id"] != tid for t in r.json())

        # anonymous detail -> 404 (deny-by-default, not 403, per lib/auth.authorize)
        r = client.get(f"/talents/{tid}")
        assert r.status_code == 404, r.text

        # owner can see it
        r = client.get(f"/talents/{tid}", headers=owner_headers)
        assert r.status_code == 200
        assert r.json()["status"] == "pending"

        # another authenticated user cannot see it (still 404)
        import pymongo, os, time
        from datetime import datetime, timedelta, timezone

        db = pymongo.MongoClient(os.environ.get("MONGO_URL", "mongodb://localhost:27017"))[os.environ.get("DB_NAME", "app")]
        other_uid = f"tscheck-other-{uuid.uuid4().hex[:8]}"
        other_token = f"tscheck_session_other_{uuid.uuid4().hex[:8]}"
        db.users.insert_one({"user_id": other_uid, "email": f"{other_uid}@example.com", "name": "Other", "picture": ""})
        db.user_sessions.insert_one({"user_id": other_uid, "session_token": other_token, "expires_at": datetime.now(timezone.utc) + timedelta(days=1)})
        try:
            r = client.get(f"/talents/{tid}", headers={"Authorization": f"Bearer {other_token}"})
            assert r.status_code == 404, r.text
        finally:
            db.user_sessions.delete_many({"user_id": other_uid})
            db.users.delete_many({"user_id": other_uid})

        # owner cannot approve their own profile
        r = client.patch(f"/talents/{tid}/status", json={"status": "approved"}, headers=owner_headers)
        assert r.status_code == 403, r.text

        # admin approves
        r = admin_client.patch(f"/talents/{tid}/status", json={"status": "approved"})
        assert r.status_code == 200, r.text
        assert r.json()["status"] == "approved"

        # now publicly visible
        r = client.get("/talents")
        assert any(t["id"] == tid for t in r.json())
        r = client.get(f"/talents/{tid}")
        assert r.status_code == 200
    finally:
        admin_client.delete(f"/talents/{tid}")
