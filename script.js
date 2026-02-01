// === NASTAVI TO ===
const API_URL = "https://script.google.com/macros/s/AKfycbzbDymLy7RZytpyPBte_rU7pYACwf5NxLVHAZHWiWK885CwiH5ndqIC7ccxPgUglFXy/exec";

// --- elementi ---
const rsvpForm = document.getElementById("rsvpForm");
const rsvpStatus = document.getElementById("rsvpStatus");
const wishlistEl = document.getElementById("wishlist");

// --- lokalni cache (da se ime/priimek ne izgubi) ---
const RSVP_LOCAL_KEY = "najin_dan_rsvp_local_v2";

function loadLocalRSVP() {
  try {
    const raw = localStorage.getItem(RSVP_LOCAL_KEY);
    if (!raw) return;
    const d = JSON.parse(raw);

    if (d.attendance) document.getElementById("attendance").value = d.attendance;
    if (d.ime) document.getElementById("ime").value = d.ime;
    if (d.priimek) document.getElementById("priimek").value = d.priimek;
  } catch {}
}

function saveLocalRSVP(attendance, ime, priimek) {
  localStorage.setItem(
    RSVP_LOCAL_KEY,
    JSON.stringify({ attendance, ime, priimek, savedAt: new Date().toISOString() })
  );
}

loadLocalRSVP();

// --- helper fetch (brez custom headers, da se izognemo preflight/CORS) ---
async function postJSONNoPreflight(payload) {
  const res = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  // Če Apps Script vrne HTML (login/permission), bo to pomagalo pri debug:
  const txt = await res.text();
  try {
    return JSON.parse(txt);
  } catch {
    console.error("API ni vrnil JSON. Prejet odgovor:", txt);
    return { ok: false, error: "API ni vrnil JSON (permission/deploy?)" };
  }
}

async function getWishlist() {
  const url = new URL(API_URL);
  url.searchParams.set("op", "wishlist");
  const res = await fetch(url.toString());
  return res.json();
}

// --- RSVP submit: zapiše v Sheet + shrani lokalno ---
rsvpForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const attendance = document.getElementById("attendance").value;
  const ime = document.getElementById("ime").value.trim();
  const priimek = document.getElementById("priimek").value.trim();

  if (!attendance || !ime || !priimek) {
    rsvpStatus.textContent = "Prosim izpolni vsa polja.";
    return;
  }

  rsvpStatus.textContent = "Pošiljam ...";

  try {
    saveLocalRSVP(attendance, ime, priimek);

    const result = await postJSONNoPreflight({
      op: "rsvp",
      attendance,
      ime,
      priimek,
      source: "github-pages",
    });

    if (!result.ok) throw new Error(result.error || "Napaka");

    rsvpStatus.textContent = "Hvala! Shranjeno ✅";
  } catch (err) {
    console.error(err);
    rsvpStatus.textContent = "Ni uspelo poslati 😕 Poskusi še enkrat.";
  }
});

// --- Wishlist global sync ---
function toBool(v) {
  return v === true || v === 1 || v === "1" || String(v).toLowerCase() === "true";
}

function setItemUI(li, taken, takenBy) {
  const cb = li.querySelector(".wishCheck");
  const isTaken = toBool(taken);

  cb.checked = isTaken;
  li.classList.toggle("taken", isTaken);
  li.title = isTaken && takenBy ? `Izbral: ${takenBy}` : "";
}

async function refreshWishlistFromServer() {
  const data = await getWishlist();
  if (!data.ok) throw new Error(data.error || "Wishlist load failed");

  const state = data.wishlist || {};
  const items = wishlistEl.querySelectorAll(".wish");

  items.forEach((li) => {
    const id = li.dataset.id;
    const info = state[id];
    if (!info) return;
    setItemUI(li, info.taken, info.takenBy);
  });
}

wishlistEl.addEventListener("change", async (e) => {
  if (!e.target.classList.contains("wishCheck")) return;

  const li = e.target.closest(".wish");
  const id = li.dataset.id;
  const taken = e.target.checked;

  const ime = document.getElementById("ime").value.trim();
  const priimek = document.getElementById("priimek").value.trim();
  const takenBy = (ime || priimek) ? `${ime} ${priimek}`.trim() : "Anonimno";

  // optimistično UI
  setItemUI(li, taken, takenBy);

  e.target.disabled = true;

  try {
    const result = await postJSONNoPreflight({
      op: "toggle",
      id,
      taken,
      takenBy,
    });

    if (!result.ok) throw new Error(result.error || "Toggle failed");

    await refreshWishlistFromServer();
  } catch (err) {
    console.error(err);
    try { await refreshWishlistFromServer(); } catch {}
    alert("Ni uspelo shraniti izbire. Poskusi še enkrat.");
  } finally {
    e.target.disabled = false;
  }
});

// začetni load + občasni refresh
(async function init() {
  try {
    await refreshWishlistFromServer();
    setInterval(() => {
      refreshWishlistFromServer().catch(() => {});
    }, 15000);
  } catch (err) {
    console.error(err);
  }
})();

