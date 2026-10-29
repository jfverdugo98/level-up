// Configuración global de Level Up. Cambia aquí el número y los textos de contacto.
window.LEVELUP = {
  whatsapp: "584122903606",            // formato internacional, sin "+" ni espacios
  telefonoVisible: "+58 412-290-3606",
  ubicacion: "San Juan de Colón, Táchira",
  entregas: "San Cristóbal",
  // Redes sociales: solo el nombre de usuario, sin @. Si queda vacío, el botón no aparece.
  instagram: "levelup_sjc",
  facebook: "Lev3lUP.sjc",
  tiktok: "",                          // TODO: poner el usuario cuando se cree la cuenta
};

// Enlace de WhatsApp con mensaje prellenado.
window.waLink = function (mensaje) {
  const texto = mensaje || "¡Hola Level Up! 🎮 Vengo de la página web y quiero más información.";
  return `https://wa.me/${window.LEVELUP.whatsapp}?text=${encodeURIComponent(texto)}`;
};
