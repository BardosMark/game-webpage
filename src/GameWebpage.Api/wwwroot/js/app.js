"use strict";

const tokenKey = "gw_token";


const backgrounds = [
    "Képek/hatter.png",
    "Képek/hatter2.png"
];

let currentBgIndex = 0;


function setRandomBackground() {
    currentBgIndex = Math.floor(Math.random() * backgrounds.length);
    applyBackground(backgrounds[currentBgIndex]);
}


function applyBackground(bg) {
    document.body.style.backgroundImage = `url('${bg}')`;
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundPosition = "center";
    document.body.style.backgroundRepeat = "no-repeat";

    document.body.style.backgroundColor = "rgba(0,0,0,0.4)";
    document.body.style.backgroundBlendMode = "darken";
}


function startBackgroundRotation() {
    setInterval(() => {
        currentBgIndex = (currentBgIndex + 1) % backgrounds.length;
        applyBackground(backgrounds[currentBgIndex]);
    }, 40000); // 40 másodperc
}


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


function startSlideshow() {
    const slides = document.querySelectorAll(".slide");
    let index = 0;

    setInterval(() => {
        slides[index].classList.remove("active");

        index++;
        if (index >= slides.length) {
            index = 0; // 🔥 újraindul
        }

        slides[index].classList.add("active");
    }, 4000);
}


function wireUi() {

    /* 🔥 HÁTTÉR */
    setRandomBackground();
    startBackgroundRotation();

    startSlideshow();

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