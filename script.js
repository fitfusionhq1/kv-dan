// === NASTAVI TO ===
const API_URL =
  "https://script.google.com/macros/s/AKfycbzbDymLy7RZytpyPBte_rU7pYACwf5NxLVHAZHWiWK885CwiH5ndqIC7ccxPgUglFXy/exec";

// --- elementi ---
const rsvpForm = document.getElementById("rsvpForm");
const rsvpStatus = document.getElementById("rsvpStatus");
const wishlistEl = document.getElementById("wishlist");

// --- lokalni cache (če ga želiš uporabljat) ---
const RSVP_LOCAL_KEY = "najin_dan_rsvp_local_v3";

// ---- helpers ----
async function postJSONNoPreflight(payload) {
  const res = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify(payload),
  });

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

function toBool(v) {
  return v === true || v === 1 || v === "1" || String(v).toLowerCase() === "true";
}

// === RSVP ===
function clearRSVPFields() {
  // reset na začetne vrednosti iz HTML
  rsvpForm.reset();

  // HARD clear (autofill-proof)
  const attendanceEl = document.getElementById("attendance");
  const imeEl = document.getElementById("ime");
  const priimekEl = document.getElementById("priimek");

  attendanceEl.selectedIndex = 0;
  imeEl.value = "";
  priimekEl.value = "";

  // odstrani fokus (Safari/Chrome mobilni včasih takoj vrne vrednosti)
  attendanceEl.blur();
  imeEl.blur();
  priimekEl.blur();

  // pobriši local cache
  localStorage.removeItem(RSVP_LOCAL_KEY);
}

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
    const result = await postJSONNoPreflight({
      op: "rsvp",
      attendance,
      ime,
      priimek,
      source: "github-pages",
    });

    if (!result.ok) throw new Error(result.error || "Napaka");

    clearRSVPFields();
    rsvpStatus.textContent = "Hvala! Shranjeno ✅";

    setTimeout(() => {
      rsvpStatus.textContent = "";
    }, 3000);
  } catch (err) {
    console.error(err);
    rsvpStatus.textContent = "Ni uspelo poslati 😕 Poskusi še enkrat.";
  }
});

// === Wishlist global sync (lock once taken) ===
function setItemUI(li, taken, takenBy) {
  const cb = li.querySelector(".wishCheck");
  const isTaken = toBool(taken);

  li.classList.toggle("taken", isTaken);
  cb.checked = isTaken;

  // title (optional)
  li.title = isTaken && takenBy ? `Izbral: ${takenBy}` : "";

  // enkrat taken => vedno zaklenjeno
  cb.disabled = isTaken;
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

  // če je že zaklenjeno, ignoriraj
  if (e.target.disabled) return;

  const li = e.target.closest(".wish");
  const id = li.dataset.id;

  // dovolimo samo "true"
  const taken = e.target.checked;
  if (!taken) {
    e.target.checked = true;
    return;
  }

  const ime = document.getElementById("ime").value.trim();
  const priimek = document.getElementById("priimek").value.trim();
  const takenBy = (ime || priimek) ? `${ime} ${priimek}`.trim() : "Anonimno";

  // optimistično UI: zakleni takoj
  setItemUI(li, true, takenBy);

  try {
    const result = await postJSONNoPreflight({
      op: "toggle",
      id,
      taken: true,
      takenBy,
    });

    if (!result.ok) throw new Error(result.error || "Toggle failed");
    await refreshWishlistFromServer();
  } catch (err) {
    console.error(err);
    // rollback
    try { await refreshWishlistFromServer(); } catch {}
    alert("Ni uspelo shraniti izbire. Poskusi še enkrat.");
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
