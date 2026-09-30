def test_health(client):
    assert client.get("/health").json() == {"status": "ok"}


def test_docs_available(client):
    assert client.get("/docs").status_code == 200


def test_register_login_and_get_user(client):
    r = client.post("/users", json={"name": "Ana", "email": "ana@test.com", "password": "secret123"})
    assert r.status_code == 201
    user_id = r.json()["id"]
    assert "password" not in r.json() and "password_hash" not in r.json()

    dup = client.post("/users", json={"name": "Ana", "email": "ANA@test.com", "password": "secret123"})
    assert dup.status_code == 409

    assert client.post("/login", json={"email": "ana@test.com", "password": "mala"}).status_code == 401
    ok = client.post("/login", json={"email": "ana@test.com", "password": "secret123"})
    assert ok.status_code == 200 and ok.json()["access_token"]

    got = client.get(f"/users/{user_id}").json()
    assert got["name"] == "Ana" and got["video_count"] == 0
    assert client.get("/users/9999").status_code == 404


def test_video_crud_flow(client, auth, upload_files):
    h = auth["headers"]
    files = {k: v for k, v in upload_files.items()}
    created = client.post("/videos", data={"title": "Mi video", "description": "desc"}, files=files, headers=h)
    assert created.status_code == 201, created.text
    video = created.json()
    assert video["user_name"] == "Ana" and video["views"] == 0

    assert client.get("/users/%d" % auth["user"]["id"]).json()["video_count"] == 1
    assert len(client.get("/videos").json()) == 1
    assert len(client.get("/videos", params={"q": "mi"}).json()) == 1
    assert client.get("/videos", params={"q": "zzz"}).json() == []
    assert len(client.get("/videos", params={"user_id": auth["user"]["id"]}).json()) == 1

    assert client.get(f"/videos/{video['id']}").json()["title"] == "Mi video"
    assert client.post(f"/videos/{video['id']}/view").json()["views"] == 1

    upd = client.put(f"/videos/{video['id']}", data={"title": "Nuevo titulo"}, headers=h)
    assert upd.status_code == 200 and upd.json()["title"] == "Nuevo titulo"
    assert upd.json()["description"] == "desc"

    assert client.delete(f"/videos/{video['id']}", headers=h).status_code == 204
    assert client.get(f"/videos/{video['id']}").status_code == 404


def test_video_validation_and_permissions(client, auth, upload_files):
    h = auth["headers"]
    assert client.post("/videos", data={"title": "x"}, files=upload_files).status_code == 401

    bad_video = dict(upload_files, video=("clip.avi", b"1234", "video/x-msvideo"))
    assert client.post("/videos", data={"title": "x"}, files=bad_video, headers=h).status_code == 422
    bad_thumb = dict(upload_files, thumbnail=("t.gif", b"GIF89a", "image/gif"))
    assert client.post("/videos", data={"title": "x"}, files=bad_thumb, headers=h).status_code == 422

    video = client.post("/videos", data={"title": "ok"}, files=upload_files, headers=h).json()
    client.post("/users", json={"name": "Beto", "email": "beto@test.com", "password": "secret123"})
    token = client.post("/login", json={"email": "beto@test.com", "password": "secret123"}).json()["access_token"]
    other = {"Authorization": f"Bearer {token}"}
    assert client.put(f"/videos/{video['id']}", data={"title": "hack"}, headers=other).status_code == 403
    assert client.delete(f"/videos/{video['id']}", headers=other).status_code == 403


def test_comments_and_recommended(client, auth, upload_files):
    h = auth["headers"]
    v1 = client.post("/videos", data={"title": "uno"}, files=upload_files, headers=h).json()
    v2 = client.post("/videos", data={"title": "dos"}, files=upload_files, headers=h).json()

    assert client.post(f"/videos/{v1['id']}/comments", json={"content": "hola"}).status_code == 401
    c = client.post(f"/videos/{v1['id']}/comments", json={"content": "hola"}, headers=h)
    assert c.status_code == 201 and c.json()["user_name"] == "Ana"
    assert client.post(f"/videos/{v1['id']}/comments", json={"content": "  "}, headers=h).status_code == 422
    assert client.post("/videos/999/comments", json={"content": "x"}, headers=h).status_code == 404

    listed = client.get(f"/videos/{v1['id']}/comments").json()
    assert len(listed) == 1 and listed[0]["content"] == "hola"

    rec = client.get(f"/videos/{v1['id']}/recommended").json()
    assert [v["id"] for v in rec] == [v2["id"]]
