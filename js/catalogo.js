// Tarjetas de producto, buscador y filtros del catálogo.
(function () {
  const COND = { usado: "Usado", openbox: "Open box", sellado: "Sellado" };
  const CAT = { consola: "Consola", accesorio: "Accesorio" };
  // Versión cuadrada de 600 px que genera el script para las tarjetas.
  const mini = (f) => f.replace(/\.jpg(\?|$)/, "-mini.jpg$1");
  const urlDetalle = (p) => `producto.html?id=${encodeURIComponent(p.id)}`;
  const msgWhatsApp = (p) => p.disponible
    ? `¡Hola Level Up! 🎮 Me interesa: ${p.nombre} (${COND[p.condicion]}). ¿Sigue disponible?`
    : `¡Hola Level Up! 🎮 ¿Me avisan cuando tengan ${p.nombre}?`;

  // Fotos generadas por scripts/procesar_fotos.swift (data/fotos.js)
  const FOTOS = window.FOTOS || {};
  window.PRODUCTOS.forEach((p) => {
    p.fotos = p.fotos && p.fotos.length ? p.fotos : (FOTOS[p.id] || []).slice();
    // portada: n → la foto "<id>-n.jpg" pasa a ser la primera
    const i = p.portada ? p.fotos.findIndex((f) => f.includes(`/${p.id}-${p.portada}.jpg`)) : -1;
    if (i > 0) p.fotos.unshift(p.fotos.splice(i, 1)[0]);
  });

  const usd = (n) => `$${n.toLocaleString("es-VE")}`;
  // precioAntes > precio muestra el precio anterior tachado y el ahorro.
  const precioHTML = (p) => {
    if (!p.disponible) return `<div class="price ask">Agotado</div>`;
    if (p.precio == null) return `<div class="price ask">Consultar precio</div>`;
    const rebaja = p.precioAntes > p.precio
      ? ` <s class="price-old">${usd(p.precioAntes)}</s> <span class="price-off">-${usd(p.precioAntes - p.precio)}</span>`
      : "";
    return `<div class="price">${usd(p.precio)}${rebaja}</div>`;
  };

  const mediaHTML = (p) => {
    const fotos = p.fotos || [];
    const img = fotos.length
      ? `<img src="${mini(fotos[0])}" alt="${p.nombre}" loading="lazy">`
      : `<div class="placeholder"><div class="emoji">${p.emoji || "🎮"}</div><small>Foto próximamente</small></div>`;
    const dots = fotos.length > 1
      ? `<div class="photo-nav">${fotos.map((_, i) => `<button class="${i ? "" : "on"}" data-i="${i}" aria-label="Foto ${i + 1}"></button>`).join("")}</div>`
      : "";
    return `
      <div class="card-media">
        ${img}
        <span class="cond ${p.condicion}">${COND[p.condicion]}</span>
        ${p.disponible ? "" : `<div class="sold-out">AGOTADO</div>`}
        ${dots}
      </div>`;
  };

  window.renderCard = (p) => `
      <article class="card" data-id="${p.id}">
        ${mediaHTML(p)}
        <div class="card-body">
          <div class="card-cat">${CAT[p.categoria]} · ${p.marca}</div>
          <h3><a class="card-link" href="${urlDetalle(p)}">${p.nombre}</a></h3>
          <p class="desc">${p.descripcion}</p>
          ${precioHTML(p)}
          <div class="card-actions">
            <a class="btn btn-wa btn-sm" href="${waLink(msgWhatsApp(p))}" target="_blank" rel="noopener">
              ${window.WA_ICON} ${p.disponible ? "Lo quiero" : "Avísame"}
            </a>
            <span class="ver-mas">Ver detalles →</span>
          </div>
        </div>
      </article>`;

  // Compartido con la página de detalle (js/producto.js)
  window.CATALOGO = { COND, CAT, urlDetalle, msgWhatsApp, precioHTML, mini };

  // Cambiar de foto con los puntitos (delegado, sirve en Home y Catálogo)
  document.addEventListener("click", (e) => {
    const dot = e.target.closest(".photo-nav button");
    if (!dot) return;
    const card = dot.closest(".card");
    const p = window.PRODUCTOS.find((x) => x.id === card.dataset.id);
    card.querySelector(".card-media img").src = mini(p.fotos[dot.dataset.i]);
    card.querySelectorAll(".photo-nav button").forEach((b) => b.classList.toggle("on", b === dot));
  });

  // ---- Página de catálogo ----
  const grid = document.getElementById("catalogo");
  if (!grid) return;

  const state = { q: "", categoria: "todos", marca: "todas", condicion: "todas", soloDisp: false };
  const params = new URLSearchParams(location.search);
  if (params.get("q")) state.q = params.get("q");

  const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

  function render() {
    const q = norm(state.q.trim());
    const items = window.PRODUCTOS.filter((p) =>
      (!q || norm(`${p.nombre} ${p.descripcion} ${p.marca} ${CAT[p.categoria]} ${COND[p.condicion]}`).includes(q)) &&
      (state.categoria === "todos" || p.categoria === state.categoria) &&
      (state.marca === "todas" || p.marca === state.marca) &&
      (state.condicion === "todas" || p.condicion === state.condicion) &&
      (!state.soloDisp || p.disponible)
    ).sort((a, b) => b.disponible - a.disponible);

    document.getElementById("count").textContent =
      `${items.length} producto${items.length === 1 ? "" : "s"}`;
    grid.innerHTML = items.length
      ? items.map(window.renderCard).join("")
      : `<p class="empty">No encontramos productos con esa búsqueda 👾<br>
         <a class="btn btn-wa btn-sm" style="margin-top:16px" href="${waLink(`¡Hola Level Up! Estoy buscando: ${state.q}`)}" target="_blank" rel="noopener">Pregúntanos por WhatsApp</a></p>`;
  }

  const input = document.getElementById("buscar");
  input.value = state.q;
  input.addEventListener("input", (e) => { state.q = e.target.value; render(); });

  document.querySelectorAll(".chips").forEach((group) => {
    group.addEventListener("click", (e) => {
      const chip = e.target.closest(".chip");
      if (!chip) return;
      group.querySelectorAll(".chip").forEach((c) => c.classList.toggle("on", c === chip));
      state[group.dataset.key] = chip.dataset.val;
      render();
    });
  });
  document.getElementById("soloDisp").addEventListener("change", (e) => { state.soloDisp = e.target.checked; render(); });

  render();
})();
