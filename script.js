// === NASTAVI TO ===
const API_URL = "https://script.google.com/macros/s/AKfycbzbDymLy7RZytpyPBte_rU7pYACwf5NxLVHAZHWiWK885CwiH5ndqIC7ccxPgUglFXy/exec"; // npr. https://script.google.com/macros/s/.../exec

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
    body: JSON.stringify(payload), // fetch bo uporabil text/plain;charset=UTF-8 (simple request)
  });
  return res.json();
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
    // lokalno (da si oseba ne rabi še 1x tipkat)
    saveLocalRSVP(attendance, ime, priimek);

    // v Google Sheet
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
    rsvpStatus.textContent = "Ni uspelo poslati 😕 Poskusi še enkrat.";
    console.error(err);
  }
});

// --- Wishlist global sync ---
function setItemUI(li, taken, takenBy) {
  const cb = li.querySelector(".wishCheck");
  cb.checked = !!taken;
  li.classList.toggle("taken", !!taken);

  // optional: majhen “kdo je vzel” (če želiš)
  // (ne spreminjamo HTML-ja, samo title)
  li.title = taken && takenBy ? `Izbral: ${takenBy}` : "";
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

  // kdo je izbral? vzamemo iz RSVP polj, če so izpolnjena
  const ime = document.getElementById("ime").value.trim();
  const priimek = document.getElementById("priimek").value.trim();
  const takenBy = (ime || priimek) ? `${ime} ${priimek}`.trim() : "Anonimno";

  // optimistično UI
  setItemUI(li, taken, takenBy);

  // zakleni checkbox med pošiljanjem
  e.target.disabled = true;

  try {
    const result = await postJSONNoPreflight({
      op: "toggle",
      id,
      taken,
      takenBy,
    });

    if (!result.ok) throw new Error(result.error || "Toggle failed");

    // po uspehu osveži iz strežnika (da je 100% usklajeno)
    await refreshWishlistFromServer();
  } catch (err) {
    console.error(err);
    // rollback (poskusi ponovno prebrati)
    try { await refreshWishlistFromServer(); } catch {}
    alert("Ni uspelo shraniti izbire. Poskusi še enkrat.");
  } finally {
    e.target.disabled = false;
  }
});

// začetni load + občasni refresh (da se posodobi, če nekdo drug klikne)
(async function init() {
  try {
    await refreshWishlistFromServer();
    // refresh na 15s (lahko spremeniš ali odstraniš)
    setInterval(() => {
      refreshWishlistFromServer().catch(() => {});
    }, 15000);
  } catch (err) {
    console.error(err);
  }
})();
