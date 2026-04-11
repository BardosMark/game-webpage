type ReviewItem = {
  username: string;
  rating: number;
  message: string;
  createdAt: string;
};

const tokenKey = "gw_token";

function getToken(): string | null {
  return localStorage.getItem(tokenKey);
}

function setToken(token: string | null) {
  if (token) localStorage.setItem(tokenKey, token);
  else localStorage.removeItem(tokenKey);
  renderTokenStatus();
}

function renderTokenStatus() {
  const el = document.getElementById("tokenStatus")!;
  const t = getToken();
  el.textContent = t ? "van (localStorage)" : "nincs";
}

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");

  const t = getToken();
  if (t) headers.set("Authorization", `Bearer ${t}`);

  const res = await fetch(path, { ...options, headers });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const msg = (data && data.error) ? data.error : `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data as T;
}

function qs(id: string): HTMLInputElement {
  return document.getElementById(id) as HTMLInputElement;
}
function qst(id: string): HTMLTextAreaElement {
  return document.getElementById(id) as HTMLTextAreaElement;
}

function setMsg(id: string, msg: string) {
  (document.getElementById(id) as HTMLElement).textContent = msg;
}

async function refreshReviews() {
  const container = document.getElementById("reviews")!;
  container.innerHTML = "Töltés...";
  try {
    const items = await api<ReviewItem[]>("/api/reviews", { method: "GET" });
    if (items.length === 0) {
      container.innerHTML = "<div class='muted'>Még nincs review.</div>";
      return;
    }
    container.innerHTML = "";
    for (const r of items) {
      const div = document.createElement("div");
      div.className = "review";
      const dt = new Date(r.createdAt);
      div.innerHTML = `
        <div><b>${escapeHtml(r.username)}</b> — ⭐ ${r.rating}</div>
        <div class="muted">${dt.toLocaleString()}</div>
        <div style="margin-top:8px; white-space:pre-wrap;">${escapeHtml(r.message)}</div>
      `;
      container.appendChild(div);
    }
  } catch (e: any) {
    container.innerHTML = `<div class='muted'>Hiba: ${escapeHtml(e.message || String(e))}</div>`;
  }
}

function escapeHtml(s: string) {
    return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;","'":"&#39;" }[c] as string));
}

function wireUi() {
  renderTokenStatus();

  document.getElementById("btnRegister")!.addEventListener("click", async () => {
    setMsg("authMsg", "");
    try {
      const username = qs("regUser").value;
      const password = qs("regPass").value;
      await api("/api/auth/register", { method: "POST", body: JSON.stringify({ username, password }) });
      setMsg("authMsg", "Sikeres regisztráció. Most lépj be.");
    } catch (e: any) {
      setMsg("authMsg", "Hiba: " + (e.message || String(e)));
    }
  });

  document.getElementById("btnLogin")!.addEventListener("click", async () => {
    setMsg("authMsg", "");
    try {
      const username = qs("logUser").value;
      const password = qs("logPass").value;
      const r = await api<{ token: string }>("/api/auth/login", { method: "POST", body: JSON.stringify({ username, password }) });
      setToken(r.token);
      setMsg("authMsg", "Sikeres bejelentkezés.");
    } catch (e: any) {
      setMsg("authMsg", "Hiba: " + (e.message || String(e)));
    }
  });

  document.getElementById("btnLogout")!.addEventListener("click", () => {
    setToken(null);
    setMsg("authMsg", "Kijelentkezve.");
  });

  document.getElementById("btnSendReview")!.addEventListener("click", async () => {
    setMsg("reviewMsg", "");
    try {
      const rating = Number(qs("rating").value);
      const message = qst("reviewMessage").value;
      await api("/api/reviews", { method: "POST", body: JSON.stringify({ rating, message }) });
      setMsg("reviewMsg", "Review elmentve.");
      qst("reviewMessage").value = "";
      await refreshReviews();
    } catch (e: any) {
      setMsg("reviewMsg", "Hiba: " + (e.message || String(e)));
    }
  });

  document.getElementById("btnSendReport")!.addEventListener("click", async () => {
    setMsg("reportMsg", "");
    try {
      const title = qs("reportTitle").value;
      const message = qst("reportMessage").value;
      await api("/api/reports", { method: "POST", body: JSON.stringify({ title, message }) });
      setMsg("reportMsg", "Report elmentve (nem listázódik).");
      qs("reportTitle").value = "";
      qst("reportMessage").value = "";
    } catch (e: any) {
      setMsg("reportMsg", "Hiba: " + (e.message || String(e)));
    }
  });

  document.getElementById("btnRefresh")!.addEventListener("click", () => refreshReviews());

  refreshReviews();
}

document.addEventListener("DOMContentLoaded", wireUi);
