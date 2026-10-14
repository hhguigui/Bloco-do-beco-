# Auth testing (Emergent Google Auth) — Bloco do Beco
DB name: see backend/.env DB_NAME (="app"). Collections: users {user_id,email,name,picture}, user_sessions {user_id,session_token,expires_at}.
Create a test artist session:
mongosh app --eval "var u='test-user-'+Date.now(); var t='test_session_'+Date.now(); db.users.insertOne({user_id:u,email:'test.user.'+Date.now()+'@example.com',name:'Test User',picture:'',created_at:new Date()}); db.user_sessions.insertOne({user_id:u,session_token:t,expires_at:new Date(Date.now()+7*864e5),created_at:new Date()}); print(t)"
API: curl -H "Authorization: Bearer <token>" http://localhost:8001/api/auth/me
Browser: add cookie session_token=<token> (domain of preview host, path=/, httpOnly, secure, sameSite=None).
Admin: password `beco2026` at /admin (cookie bdb_admin) OR Google login with an email in ADMIN_EMAILS.
