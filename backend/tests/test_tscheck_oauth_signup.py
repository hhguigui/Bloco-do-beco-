"""Criterion: Cadastro de novos artistas usa Google OAuth (Emergent).

- POST /api/talents without a session -> 401.
- With a test session (Authorization: Bearer <session_token>) the talent is created,
  always as status "pending" with owner_id stamped server-side — client-sent status/owner_id
  fields must be ignored (no mass assignment).
"""

import uuid


def talent_payload(name: str) -> dict:
    return {
        "name": name,
        "category": "musica",
        "specialty": "Violão",
        "bio": "Perfil de teste automatizado.",
        "gender": "nao_informado",
        "age_range": "25-34",
        "experience": "2-5",
        "address": "Rua de Teste, 123, Jardim Ibirapuera",
        "lat": -23.6,
        "lng": -46.6,
        "phone": "",
        "instagram": "",
        "photo": "",
        "activities": [],
        # attempted mass-assignment — must be ignored server-side
        "status": "approved",
        "owner_id": "hacker-user-id",
    }


def test_create_talent_requires_session(client):
    name = f"tscheck-oauth-{uuid.uuid4().hex[:8]}"
    r = client.post("/talents", json=talent_payload(name))
    assert r.status_code == 401, r.text


def test_create_talent_with_session_is_pending_and_ignores_mass_assignment(client, artist_session):
    name = f"tscheck-oauth-{uuid.uuid4().hex[:8]}"
    r = client.post(
        "/talents",
        json=talent_payload(name),
        headers={"Authorization": f"Bearer {artist_session['token']}"},
    )
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["name"] == name
    assert body["status"] == "pending", body  # ignored client-sent "approved"
    assert body["owner_id"] == artist_session["user_id"], body  # ignored client-sent owner_id

    # cleanup
    client.delete(f"/talents/{body['id']}", headers={"Authorization": f"Bearer {artist_session['token']}"})
