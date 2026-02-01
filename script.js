:root{
  --bg:#0b1020;
  --card:#121a33;
  --text:#eaf0ff;
  --muted:#b7c3e6;
  --border:rgba(255,255,255,.14);
  --shadow:rgba(0,0,0,.35);
  --btn:#4c7dff;
}

*{box-sizing:border-box}
body{
  margin:0;
  min-height:100svh;
  display:grid;
  place-items:center;
  font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;
  background:
    radial-gradient(900px 500px at 30% 10%, #1b2a6b 0%, transparent 60%),
    var(--bg);
  color:var(--text);
  padding:24px;
}

.wrap{ width:min(720px, 100%); }

.card{
  background: linear-gradient(180deg, rgba(255,255,255,.06), transparent 60%), var(--card);
  border:1px solid var(--border);
  border-radius:18px;
  padding:22px;
  box-shadow:0 18px 60px var(--shadow);
}

.hero h1{
  margin:0;
  font-size:36px;
  letter-spacing:.5px;
}

.subtitle{
  margin:6px 0 0;
  color:var(--muted);
  font-size:16px;
}

.lead{
  margin:16px 0 18px;
  color:var(--muted);
  line-height:1.6;
}

.form{ margin-top:8px; }

.field{ display:flex; flex-direction:column; gap:8px; margin:12px 0; }
label{ font-weight:650; }

select, input{
  width:100%;
  padding:12px 12px;
  border-radius:12px;
  border:1px solid var(--border);
  background:rgba(255,255,255,.04);
  color:var(--text);
  outline:none;
}

select:focus, input:focus{ border-color: rgba(76,125,255,.75); }

.grid2{
  display:grid;
  gap:12px;
  grid-template-columns:1fr;
}
@media (min-width: 520px){
  .grid2{ grid-template-columns:1fr 1fr; }
}

.btn{
  width:100%;
  margin-top:6px;
  padding:12px 14px;
  border-radius:12px;
  border:1px solid var(--border);
  background:var(--btn);
  color:white;
  font-weight:700;
  cursor:pointer;
}

.hint{ margin:10px 0 0; min-height:20px; color:var(--muted); }
.tiny{ margin:10px 0 0; font-size:13px; color:rgba(234,240,255,.7); line-height:1.5; }

.sep{
  border:none;
  height:1px;
  background:var(--border);
  margin:18px 0;
}

h2{ margin:0 0 10px; font-size:18px; }

.wishlist{
  list-style:none;
  padding:0;
  margin:10px 0 0;
  display:flex;
  flex-direction:column;
  gap:10px;
}

.wish{
  border:1px solid var(--border);
  border-radius:14px;
  padding:12px;
  background:rgba(255,255,255,.03);
}

.wishRow{
  display:flex;
  align-items:center;
  gap:12px;
  cursor:pointer;
}

.wishCheck{
  width:18px;
  height:18px;
}

.wishText{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:12px;
  width:100%;
}

.wishName{ font-weight:650; }
.wishLink{
  color:var(--text);
  opacity:.9;
  text-decoration:underline;
  text-underline-offset:3px;
}

.wish.taken .wishName{
  text-decoration: line-through;
  opacity:.55;
}
.wish.taken .wishLink{
  opacity:.45;
  pointer-events:none;
  text-decoration:none;
}
