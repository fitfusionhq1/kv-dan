const copyBtn = document.getElementById("copyLinkBtn");
const statusEl = document.getElementById("status");

// Sem nastaviš link, ki ga želiš kopirati (npr. tvoj IG, meni, Google Maps ...)
const linkToCopy = "https://example.com";

copyBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(linkToCopy);
    statusEl.textContent = "Link kopiran ✅";
  } catch (e) {
    statusEl.textContent = "Kopiranje ni uspelo. Označi in kopiraj ročno: " + linkToCopy;
  }
});
