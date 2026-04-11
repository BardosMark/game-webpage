"use strict";

const tokenKey = "gw_token";

/* 🔥 RANDOM HÁTTÉR */
function setRandomBackground() {
    const backgrounds = [
        "Képek/hatter.png",
        "Képek/hatter2.png"
    ];

    const random = Math.floor(Math.random() * backgrounds.length);
    const selected = backgrounds[random];

    document.body.style.backgroundImage = `url('${selected}')`;
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundPosition = "center";
    document.body.style.backgroundRepeat = "no-repeat";

    // opcionális sötétítés (szebb UI)
    document.body.style.backgroundColor = "rgba(0,0,0,0.4)";
    document.body.style.backgroundBlendMode = "darken";
}

/* TOKEN */
function getToken() {
    return localStorage.getItem(tokenKey);
}

function setToken(token) {
    if (token)
        localStorage.setItem(tokenKey, token);
    else
        localStorage.removeItem(tokenKey);
    renderTokenStatus();
}

function renderTokenStatus() {
    const el = document.getElementById("tokenStatus");
    const t = getToken();
    el.textContent = t ? "van (localStorage)" : "nincs";
}

/* API */
async function api(path, options = {}) {
    const headers = new Headers(options.headers || {});
    headers.set("Content-Type", "application/json");

    const t = getToken();
    if (t)
        headers.set("Authorization", `Bearer ${t}`);

    const res = await fetch(path, { ...options, headers });
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;

    if (!res.ok) {
        throw new Error(data?.error || `HTTP ${res.status}`);
    }

    return data;
}

/* HELPERS */
function qs(id) {
    return document.getElementById(id);
}

function setMsg(id, msg) {
    document.getElementById(id).textContent = msg;
}

function escapeHtml(s) {
    return s.replace(/[&<>"']/g, c => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[c]));
}

/* REVIEWS */
async function refreshReviews() {
    const container = qs("reviews");
    container.innerHTML = "Töltés...";

    try {
        const items = await api("/api/reviews");

        if (!items.length) {
            container.innerHTML = "<div class='muted'>Nincs review</div>";
            return;
        }

        container.innerHTML = "";

        for (const r of items) {
            const div = document.createElement("div");
            div.className = "review";

            div.innerHTML = `
                <b>${escapeHtml(r.username)}</b> ⭐ ${r.rating}
                <div class="muted">${new Date(r.createdAt).toLocaleString()}</div>
                <div>${escapeHtml(r.message)}</div>
            `;

            container.appendChild(div);
        }
    } catch (e) {
        container.innerHTML = "Hiba: " + e.message;
    }
}

/* UI */
function wireUi() {

    /* 🔥 RANDOM HÁTTÉR BETÖLTÉS */
    setRandomBackground();

    renderTokenStatus();

    const regMenu = qs("registerMenu");
    const logMenu = qs("loginMenu");

    const regBtn = qs("toggleRegister");
    const logBtn = qs("toggleLogin");

    regBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        regMenu.classList.toggle("hidden");
        logMenu.classList.add("hidden");
    });

    logBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        logMenu.classList.toggle("hidden");
        regMenu.classList.add("hidden");
    });

    document.addEventListener("click", (e) => {
        if (
            !regMenu.contains(e.target) &&
            !logMenu.contains(e.target) &&
            !regBtn.contains(e.target) &&
            !logBtn.contains(e.target)
        ) {
            regMenu.classList.add("hidden");
            logMenu.classList.add("hidden");
        }
    });

    /* AUTH */
    qs("btnRegister").addEventListener("click", async () => {
        try {
            await api("/api/auth/register", {
                method: "POST",
                body: JSON.stringify({
                    username: qs("regUser").value,
                    password: qs("regPass").value
                })
            });
            setMsg("authMsg", "Sikeres regisztráció");
        } catch (e) {
            setMsg("authMsg", e.message);
        }
    });

    qs("btnLogin").addEventListener("click", async () => {
        try {
            const r = await api("/api/auth/login", {
                method: "POST",
                body: JSON.stringify({
                    username: qs("logUser").value,
                    password: qs("logPass").value
                })
            });

            setToken(r.token);
            setMsg("authMsg", "Belépve");
        } catch (e) {
            setMsg("authMsg", e.message);
        }
    });

    qs("btnLogout").addEventListener("click", () => {
        setToken(null);
        setMsg("authMsg", "Kijelentkezve");
    });

    /* REVIEW */
    qs("btnSendReview").addEventListener("click", async () => {
        try {
            await api("/api/reviews", {
                method: "POST",
                body: JSON.stringify({
                    rating: Number(qs("rating").value),
                    message: qs("reviewMessage").value
                })
            });

            setMsg("reviewMsg", "Mentve");
            refreshReviews();
        } catch (e) {
            setMsg("reviewMsg", e.message);
        }
    });

    /* REPORT */
    qs("btnSendReport").addEventListener("click", async () => {
        try {
            await api("/api/reports", {
                method: "POST",
                body: JSON.stringify({
                    title: qs("reportTitle").value,
                    message: qs("reportMessage").value
                })
            });

            setMsg("reportMsg", "Mentve");
        } catch (e) {
            setMsg("reportMsg", e.message);
        }
    });

    qs("btnRefresh").addEventListener("click", refreshReviews);

    refreshReviews();
}

document.addEventListener("DOMContentLoaded", wireUi);