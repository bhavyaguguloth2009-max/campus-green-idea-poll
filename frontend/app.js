const API_BASE = "/api";
const CATEGORY_META = {
  "Waste": { icon: "♻️", label: "Waste" },
  "Energy": { icon: "⚡", label: "Energy" },
  "Water": { icon: "💧", label: "Water" },
  "Green Spaces": { icon: "🌳", label: "Green spaces" },
  "Transport": { icon: "🚲", label: "Transport" }
};

const state = { ideas: [], category: "All", search: "", sort: "popular", votedIds: readVotedIds() };
const grid = document.querySelector("#ideas-grid");
const emptyState = document.querySelector("#empty-state");
const notice = document.querySelector("#notice");
const form = document.querySelector("#idea-form");
const submitButton = document.querySelector("#submit-button");

function readVotedIds() {
  try { return JSON.parse(localStorage.getItem("greenboard-voted") || "[]"); }
  catch { return []; }
}
function saveVotedIds() {
  try { localStorage.setItem("greenboard-voted", JSON.stringify(state.votedIds)); } catch { /* Storage may be disabled. */ }
}
function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}
function dateLabel(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date);
}
function showNotice(message, type = "success") {
  notice.textContent = message;
  notice.className = `notice show ${type}`;
  notice.scrollIntoView({ behavior: "smooth", block: "nearest" });
}
function hideNotice() { notice.className = "notice"; notice.textContent = ""; }

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Something went wrong. Please try again.");
  return data;
}
async function loadIdeas() {
  grid.innerHTML = '<div class="loading-card">Loading campus ideas…</div>';
  try {
    const data = await request("/ideas");
    state.ideas = data.ideas || [];
    renderIdeas();
    updateStats();
  } catch (error) {
    grid.innerHTML = `<div class="loading-card">Could not load ideas. ${escapeHTML(error.message)}<br><br><button class="button button-outline" id="retry-load">Try again</button></div>`;
    document.querySelector("#retry-load")?.addEventListener("click", loadIdeas);
  }
}
function updateStats() {
  document.querySelector("#stat-ideas").textContent = state.ideas.length;
  document.querySelector("#stat-votes").textContent = state.ideas.reduce((total, idea) => total + Number(idea.vote_count || 0), 0);
}
function filteredIdeas() {
  const term = state.search.trim().toLowerCase();
  const ideas = state.ideas.filter(idea => {
    const matchesCategory = state.category === "All" || idea.category === state.category;
    const haystack = `${idea.title} ${idea.description} ${idea.author_name} ${idea.category}`.toLowerCase();
    return matchesCategory && (!term || haystack.includes(term));
  });
  ideas.sort((a, b) => state.sort === "newest"
    ? new Date(b.created_at) - new Date(a.created_at)
    : Number(b.vote_count || 0) - Number(a.vote_count || 0) || new Date(b.created_at) - new Date(a.created_at));
  return ideas;
}
function renderIdeas() {
  const ideas = filteredIdeas();
  emptyState.classList.toggle("hidden", ideas.length !== 0);
  if (!ideas.length) { grid.innerHTML = ""; return; }
  grid.innerHTML = ideas.map(idea => {
    const meta = CATEGORY_META[idea.category] || { icon: "🌱", label: idea.category };
    const voted = state.votedIds.includes(idea.id);
    return `<article class="idea-card">
      <div class="card-top"><span class="category-pill">${meta.icon} ${escapeHTML(meta.label)}</span><span class="card-date">${dateLabel(idea.created_at)}</span></div>
      <h3>${escapeHTML(idea.title)}</h3>
      <p class="description">${escapeHTML(idea.description)}</p>
      <div class="card-bottom"><span class="author"><span class="author-avatar">${escapeHTML((idea.author_name || "?").trim().charAt(0).toUpperCase())}</span> By ${escapeHTML(idea.author_name)}</span>
      <button class="vote-button ${voted ? "voted" : ""}" data-vote-id="${escapeHTML(idea.id)}" ${voted ? "disabled" : ""} aria-label="${voted ? "You supported this idea" : "Support this idea"}">${voted ? "✓ Supported" : "♡ Support"} <span>${Number(idea.vote_count || 0)}</span></button></div>
    </article>`;
  }).join("");
  grid.querySelectorAll("[data-vote-id]").forEach(button => button.addEventListener("click", () => voteForIdea(button.dataset.voteId, button)));
}
async function voteForIdea(id, button) {
  if (state.votedIds.includes(id)) return;
  button.disabled = true;
  try {
    const result = await request(`/ideas/${encodeURIComponent(id)}/vote`, { method: "POST" });
    state.votedIds.push(id);
    saveVotedIds();
    const item = state.ideas.find(idea => idea.id === id);
    if (item) item.vote_count = result.vote_count;
    renderIdeas();
    updateStats();
    showNotice("Thanks for supporting a greener campus idea!");
  } catch (error) {
    button.disabled = false;
    showNotice(error.message, "error");
  }
}

document.querySelector("#category-filters").addEventListener("click", event => {
  const button = event.target.closest("[data-category]");
  if (!button) return;
  state.category = button.dataset.category;
  document.querySelectorAll(".filter-chip").forEach(chip => chip.classList.toggle("active", chip === button));
  renderIdeas();
});
document.querySelector("#search-input").addEventListener("input", event => { state.search = event.target.value; renderIdeas(); });
document.querySelector("#sort-select").addEventListener("change", event => { state.sort = event.target.value; renderIdeas(); });
const descriptionField = document.querySelector("#idea-description");
descriptionField.addEventListener("input", () => { document.querySelector("#char-count").textContent = descriptionField.value.length; });

form.addEventListener("submit", async event => {
  event.preventDefault();
  hideNotice();
  if (!form.reportValidity()) return;
  submitButton.disabled = true;
  submitButton.textContent = "Submitting…";
  const payload = Object.fromEntries(new FormData(form).entries());
  try {
    const result = await request("/ideas", { method: "POST", body: JSON.stringify(payload) });
    form.reset();
    document.querySelector("#char-count").textContent = "0";
    if (result.idea) state.ideas.unshift(result.idea);
    renderIdeas();
    updateStats();
    showNotice(result.message || "Your idea was submitted for review.");
    if (!result.idea) await loadIdeas();
  } catch (error) {
    showNotice(error.message, "error");
  } finally {
    submitButton.disabled = false;
    submitButton.innerHTML = 'Submit idea <span>↗</span>';
  }
});

loadIdeas();
