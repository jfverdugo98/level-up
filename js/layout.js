// Header, footer y botón flotante de WhatsApp compartidos por todas las páginas.
(function () {
  const C = window.LEVELUP;
  const WA_ICON = '<svg viewBox="0 0 32 32" fill="currentColor" aria-hidden="true"><path d="M16 3C8.8 3 3 8.7 3 15.8c0 2.5.7 4.9 2 7L3 29l6.4-2c2 1.1 4.3 1.7 6.6 1.7 7.2 0 13-5.7 13-12.8S23.2 3 16 3zm0 23.4c-2.1 0-4.1-.6-5.9-1.7l-.4-.2-3.8 1.2 1.2-3.7-.3-.4a10.4 10.4 0 0 1-1.7-5.8C5.1 10 10 5.3 16 5.3S26.9 10 26.9 15.8 22 26.4 16 26.4zm6-7.8c-.3-.2-1.9-1-2.2-1-.3-.1-.5-.2-.7.2l-1 1.2c-.2.2-.4.2-.7.1-.3-.2-1.4-.5-2.6-1.6-1-.9-1.6-1.9-1.8-2.2-.2-.3 0-.5.1-.7l.5-.6.3-.5c.1-.2 0-.4 0-.6l-1-2.4c-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.1 1.1-1.1 2.7s1.2 3.1 1.3 3.3c.2.2 2.3 3.5 5.6 4.9 2.8 1.1 3.3.9 3.9.8.6-.1 1.9-.8 2.2-1.5.3-.7.3-1.4.2-1.5-.1-.2-.3-.3-.6-.4z"/></svg>';
  window.WA_ICON = WA_ICON;

  const REDES = [
    { key: "instagram", nombre: "Instagram", url: (u) => `https://www.instagram.com/${u}/`,
      icono: '<path d="M12 2.2c3.2 0 3.6 0 4.8.1 1.2.1 1.8.2 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .4 2.2.1 1.3.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 1.2-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.4-1.3.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-1.2-.1-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.8c.1-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.4C8.4 2.2 8.8 2.2 12 2.2zm0 1.8c-3.1 0-3.5 0-4.7.1-1.1.1-1.7.2-2.1.4-.5.2-.9.4-1.3.8-.4.4-.6.8-.8 1.3-.2.4-.3 1-.4 2.1C2.7 8.5 2.7 8.9 2.7 12s0 3.5.1 4.7c.1 1.1.2 1.7.4 2.1.2.5.4.9.8 1.3.4.4.8.6 1.3.8.4.2 1 .3 2.1.4 1.2.1 1.6.1 4.7.1s3.5 0 4.7-.1c1.1-.1 1.7-.2 2.1-.4.5-.2.9-.4 1.3-.8.4-.4.6-.8.8-1.3.2-.4.3-1 .4-2.1.1-1.2.1-1.6.1-4.7s0-3.5-.1-4.7c-.1-1.1-.2-1.7-.4-2.1-.2-.5-.4-.9-.8-1.3-.4-.4-.8-.6-1.3-.8-.4-.2-1-.3-2.1-.4C15.5 4 15.1 4 12 4zm0 3.1a4.9 4.9 0 1 1 0 9.8 4.9 4.9 0 0 1 0-9.8zm0 8.1a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4zm6.2-8.3a1.1 1.1 0 1 1-2.3 0 1.1 1.1 0 0 1 2.3 0z"/>' },
    { key: "facebook", nombre: "Facebook", url: (u) => `https://www.facebook.com/${u}`,
      icono: '<path d="M13.5 22v-8.2h2.8l.4-3.2h-3.2V8.5c0-.9.3-1.6 1.6-1.6h1.7V4.1c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.4H7.3v3.2h2.8V22h3.4z"/>' },
    { key: "tiktok", nombre: "TikTok", url: (u) => `https://www.tiktok.com/@${u}`,
      icono: '<path d="M16.6 2h-3.3v13.4a2.9 2.9 0 1 1-2-2.8V9.2a6.3 6.3 0 1 0 5.3 6.2V8.6a7.8 7.8 0 0 0 4.6 1.5V6.8a4.6 4.6 0 0 1-4.6-4.6z"/>' },
  ];
  const redes = REDES.filter((r) => C[r.key]).map((r) => `
    <a class="social" href="${r.url(C[r.key])}" target="_blank" rel="noopener" aria-label="${r.nombre} de Level Up" title="${r.nombre}">
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${r.icono}</svg>
    </a>`).join("");

  const page = document.body.dataset.page;
  const tab = (href, id, label) =>
    `<li><a href="${href}" class="${page === id ? "active" : ""}">${label}</a></li>`;

  document.body.insertAdjacentHTML("afterbegin", `
    <header class="header">
      <nav class="container nav">
        <a href="index.html" class="brand" aria-label="Level Up - Inicio">
          <img src="assets/logo-icono.png" alt="">
          <span>LEVEL UP</span>
        </a>
        <ul class="tabs" id="tabs">
          ${tab("index.html", "home", "Inicio")}
          ${tab("productos.html", "productos", "Productos")}
          ${tab("nosotros.html", "nosotros", "Nosotros")}
        </ul>
        <a class="btn btn-wa btn-sm desktop" href="${waLink()}" target="_blank" rel="noopener">${WA_ICON} WhatsApp</a>
        <button class="menu-btn" aria-label="Abrir menú" id="menuBtn">☰</button>
      </nav>
    </header>`);

  document.body.insertAdjacentHTML("beforeend", `
    <footer class="footer">
      <div class="container">
        <div class="footer-grid">
          <div>
            <h4>LEVEL UP</h4>
            <p>Compra y venta de consolas usadas y open box.<br>Tienda virtual en San Juan de Colón.</p>
            ${redes ? `<div class="socials">${redes}</div>` : ""}
          </div>
          <div>
            <h4>CONTACTO</h4>
            <p><a href="${waLink()}" target="_blank" rel="noopener">📱 ${C.telefonoVisible} (WhatsApp)</a></p>
          </div>
          <div>
            <h4>UBICACION</h4>
            <p>📍 ${C.ubicacion}<br>🚚 Entregas en ${C.entregas}<br>🛒 Tienda 100% virtual</p>
          </div>
        </div>
        <p class="copy">© ${new Date().getFullYear()} Level Up. Todos los derechos reservados.</p>
      </div>
    </footer>
    <a class="wa-float" href="${waLink()}" target="_blank" rel="noopener" aria-label="Escríbenos por WhatsApp">${WA_ICON}</a>`);

  document.getElementById("menuBtn").addEventListener("click", () =>
    document.getElementById("tabs").classList.toggle("open"));
})();
