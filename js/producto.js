// Página de detalle: galería de fotos, descripción, qué incluye y características.
(function () {
  const { COND, CAT, CATS, urlCategoria, msgWhatsApp, precioHTML, mini } = window.CATALOGO;
  const id = new URLSearchParams(location.search).get("id");
  const p = window.PRODUCTOS.find((x) => x.id === id);
  const main = document.getElementById("detalle");

  if (!p) {
    main.innerHTML = `
      <p class="empty">No encontramos este producto 👾<br><br>
        <a class="btn btn-pink" href="productos.html">Ver el catálogo</a></p>`;
    return;
  }

  document.title = `${p.nombre} · Level Up`;
  const fotos = p.fotos || [];
  let actual = 0;

  const galeria = fotos.length
    ? `
      <div class="gallery-main">
        <img id="fotoPrincipal" src="${fotos[0]}" alt="${p.nombre}">
        ${fotos.length > 1 ? `
          <button class="g-prev" aria-label="Foto anterior">‹</button>
          <button class="g-next" aria-label="Foto siguiente">›</button>
          <span class="g-count" id="contador">1 / ${fotos.length}</span>` : ""}
        <span class="cond ${p.condicion}">${COND[p.condicion]}</span>
      </div>
      ${fotos.length > 1 ? `
        <div class="thumbs">
          ${fotos.map((f, i) => `<button class="${i ? "" : "on"}" data-i="${i}" aria-label="Ver foto ${i + 1}"><img src="${mini(f)}" alt="" loading="lazy"></button>`).join("")}
        </div>` : ""}`
    : `<div class="gallery-main placeholder-big"><div class="emoji">${p.emoji || "🎮"}</div><small>Fotos próximamente</small></div>`;

  const incluye = (p.incluye || []).length
    ? `<h3 class="sub">📦 Incluye</h3><ul class="incluye">${p.incluye.map((x) => `<li>${x}</li>`).join("")}</ul>`
    : "";
  const specs = Object.keys(p.specs || {}).length
    ? `<h3 class="sub">⚙️ Características</h3>
       <dl class="specs">${Object.entries(p.specs).map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("")}</dl>`
    : "";

  main.innerHTML = `
    <nav class="breadcrumb"><a href="productos.html">← Catálogo</a> / <a href="${urlCategoria(p.categoria)}">${CATS[p.categoria]}</a> / <a href="${urlCategoria(p.categoria, p.plataforma)}">${p.plataforma}</a></nav>
    <div class="product-layout">
      <div class="gallery">${galeria}</div>
      <div class="product-info">
        <div class="card-cat">${CAT[p.categoria]} · ${p.plataforma}</div>
        <h1>${p.nombre}</h1>
        ${precioHTML(p)}
        <p class="lead-desc">${p.detalle || p.descripcion}</p>
        <a class="btn btn-wa btn-big" href="${waLink(msgWhatsApp(p))}" target="_blank" rel="noopener">
          ${window.WA_ICON} ${p.disponible ? "Lo quiero · Escribir por WhatsApp" : "Avísame cuando llegue"}
        </a>
        <ul class="trust">
          <li>✅ Revisado y probado</li>
          <li>🚚 Entrega en ${LEVELUP.entregas}</li>
          <li>💬 Te enviamos más fotos o video por WhatsApp</li>
        </ul>
        ${incluye}
        ${specs}
      </div>
    </div>`;

  // ---- Galería ----
  const principal = document.getElementById("fotoPrincipal");
  const contador = document.getElementById("contador");
  function mostrar(i) {
    if (!fotos.length) return;
    actual = (i + fotos.length) % fotos.length;
    principal.src = fotos[actual];
    if (contador) contador.textContent = `${actual + 1} / ${fotos.length}`;
    main.querySelectorAll(".thumbs button").forEach((b, j) => {
      b.classList.toggle("on", j === actual);
      if (j === actual) b.scrollIntoView({ block: "nearest", inline: "nearest" });
    });
    if (!lb.hidden) lbImg.src = fotos[actual];
  }
  main.addEventListener("click", (e) => {
    if (e.target.closest(".g-prev")) mostrar(actual - 1);
    else if (e.target.closest(".g-next")) mostrar(actual + 1);
    else if (e.target.closest(".thumbs button")) mostrar(+e.target.closest("button").dataset.i);
    else if (e.target === principal) abrirLightbox();
  });

  // Deslizar con el dedo en el celular
  let x0 = null;
  principal?.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  principal?.addEventListener("touchend", (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 40) mostrar(actual + (dx < 0 ? 1 : -1));
    x0 = null;
  });

  // ---- Pantalla completa ----
  const lb = document.getElementById("lightbox");
  const lbImg = lb.querySelector("img");
  function abrirLightbox() {
    lbImg.src = fotos[actual];
    lb.hidden = false;
    document.body.style.overflow = "hidden";
  }
  function cerrarLightbox() {
    lb.hidden = true;
    document.body.style.overflow = "";
  }
  lb.addEventListener("click", (e) => {
    if (e.target.closest(".lb-prev")) mostrar(actual - 1);
    else if (e.target.closest(".lb-next")) mostrar(actual + 1);
    else if (e.target !== lbImg) cerrarLightbox();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") mostrar(actual - 1);
    if (e.key === "ArrowRight") mostrar(actual + 1);
    if (e.key === "Escape" && !lb.hidden) cerrarLightbox();
  });

  // ---- Relacionados: misma categoría primero ----
  const otros = window.PRODUCTOS
    .filter((x) => x.id !== p.id && x.disponible)
    .sort((a, b) => (b.categoria === p.categoria) - (a.categoria === p.categoria))
    .slice(0, 4);
  if (otros.length) {
    document.getElementById("relacionados").innerHTML = otros.map(window.renderCard).join("");
    document.getElementById("relacionadosWrap").hidden = false;
  }
})();
