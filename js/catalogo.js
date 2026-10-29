// Tarjetas de producto, buscador y filtros del catálogo.
(function () {
  const COND = { usado: "Usado", openbox: "Open box", sellado: "Sellado" };
  const CAT = { consola: "Consola", juego: "Juego", control: "Control", accesorio: "Accesorio", sd: "Tarjeta SD" };
  const CATS = { consola: "Consolas", juego: "Juegos", control: "Controles", accesorio: "Accesorios", sd: "Tarjetas SD" };
  const urlCategoria = (cat, plat) =>
    `productos.html?cat=${cat}${plat ? `&plat=${encodeURIComponent(plat)}` : ""}`;
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
      // Tira deslizable: con el dedo se pasa a la siguiente foto; tocarla abre el producto.
      ? `<a class="slides" href="${urlDetalle(p)}" tabindex="-1" aria-hidden="true">${fotos
          .map((f, i) => `<img src="${mini(f)}" alt="${p.nombre}${i ? ` (foto ${i + 1})` : ""}" loading="lazy" draggable="false">`)
          .join("")}</a>`
      : `<div class="placeholder"><div class="emoji">${p.emoji || "🎮"}</div><small>Foto próximamente</small></div>`;
    const dots = fotos.length > 1
      ? `<div class="photo-nav">${fotos.map((_, i) => `<button class="${i ? "" : "on"}" data-i="${i}" aria-label="Foto ${i + 1}"></button>`).join("")}</div>`
      : "";
    return `
      <div class="card-media">
        ${img}
        <span class="cond ${p.condicion}">${COND[p.condicion]}</span>
        ${p.fotoReferencial && fotos.length ? `<span class="ref-tag">Imagen referencial</span>` : ""}
        ${p.disponible ? "" : `<div class="sold-out">AGOTADO</div>`}
        ${dots}
      </div>`;
  };

  window.renderCard = (p) => `
      <article class="card" data-id="${p.id}">
        ${mediaHTML(p)}
        <div class="card-body">
          <div class="card-cat">${CAT[p.categoria]} · ${p.plataforma}</div>
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
  window.CATALOGO = { COND, CAT, CATS, urlCategoria, urlDetalle, msgWhatsApp, precioHTML, mini };

  // Fotos de la tarjeta (delegado, sirve en Home y Catálogo):
  // los puntitos llevan a su foto y, al deslizar, se marca el puntito de la foto visible.
  document.addEventListener("click", (e) => {
    const dot = e.target.closest(".photo-nav button");
    if (!dot) return;
    const slides = dot.closest(".card-media").querySelector(".slides");
    slides.scrollTo({ left: dot.dataset.i * slides.clientWidth, behavior: "smooth" });
  });
  document.addEventListener("scroll", (e) => {
    const slides = e.target.closest && e.target.closest(".slides");
    if (!slides) return;
    const i = Math.round(slides.scrollLeft / slides.clientWidth);
    slides.parentElement.querySelectorAll(".photo-nav button").forEach((b, j) => b.classList.toggle("on", i === j));
  }, true);

  // ---- Página de catálogo ----
  const grid = document.getElementById("catalogo");
  if (!grid) return;

  const state = { q: "", categoria: "todos", plataforma: "todas", condicion: "todas", soloDisp: false };
  // Enlaces directos: productos.html?cat=juego&plat=PS5&q=mario
  const params = new URLSearchParams(location.search);
  if (params.get("q")) state.q = params.get("q");
  if (CAT[params.get("cat")]) state.categoria = params.get("cat");
  if (params.get("plat")) state.plataforma = params.get("plat");

  const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

  function render() {
    const q = norm(state.q.trim());
    const items = window.PRODUCTOS.filter((p) =>
      (!q || norm(`${p.nombre} ${p.descripcion} ${p.marca} ${p.plataforma} ${CAT[p.categoria]} ${COND[p.condicion]}`).includes(q)) &&
      (state.categoria === "todos" || p.categoria === state.categoria) &&
      (state.plataforma === "todas" || p.plataforma === state.plataforma) &&
      (state.condicion === "todas" || p.condicion === state.condicion) &&
      (!state.soloDisp || p.disponible)
    ).sort((a, b) => b.disponible - a.disponible);

    document.getElementById("count").textContent =
      `${items.length} producto${items.length === 1 ? "" : "s"}`;
    // Sin resultados: lo que se buscó, en palabras ("Juegos PS5 mario"), para el mensaje de WhatsApp.
    const buscado = [CATS[state.categoria], state.plataforma !== "todas" && state.plataforma, state.q.trim()]
      .filter(Boolean).join(" ");
    grid.innerHTML = items.length
      ? items.map(window.renderCard).join("")
      : `<p class="empty">Por ahora no tenemos ${buscado ? `<b>${buscado}</b>` : "productos con esa búsqueda"} 👾<br>
         Escríbenos y te avisamos apenas lleguen.<br>
         <a class="btn btn-wa btn-sm" style="margin-top:16px" href="${waLink(`¡Hola Level Up! 🎮 Estoy buscando: ${buscado}`)}" target="_blank" rel="noopener">Pregúntanos por WhatsApp</a></p>`;
  }

  const input = document.getElementById("buscar");
  input.value = state.q;
  input.addEventListener("input", (e) => { state.q = e.target.value; render(); });

  document.querySelectorAll(".chips").forEach((group) => {
    group.querySelectorAll(".chip").forEach((c) => c.classList.toggle("on", c.dataset.val === state[group.dataset.key]));
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
