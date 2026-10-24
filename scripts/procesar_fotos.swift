// Prepara las fotos del catálogo de Level Up.
//
// Toma las fotos de fotos-originales/<carpeta-del-producto>/ y, por defecto,
// las deja como están (sin quitar el fondo): solo las achica a 1600 px como
// máximo, las comprime y les borra los datos ocultos (GPS, teléfono, fecha).
//
// Con  --fondo-blanco  además:
//   • si el producto se ve completo: quita el fondo con la IA del Mac (la misma
//     de "Eliminar fondo" en Vista Previa) y lo centra sobre fondo blanco con
//     una sombra suave;
//   • si es un primer plano (el producto se sale del cuadro) o no se detecta:
//     usa la foto original recortada en cuadrado, para no dejarlo "cortado".
//   La portada de cada producto es la primera foto con fondo blanco.
//
// De cada foto genera dos archivos en assets/productos/:
//   <id>-N.jpg       grande, para la página del producto
//   <id>-N-mini.jpg  cuadrada de 600 px, para las tarjetas del catálogo
// y escribe data/fotos.js para la web.
//
// El id del producto es el nombre de la carpeta en minúsculas, con cualquier
// símbolo cambiado por "-"  (ej. "joycons-pink&green" → "joycons-pink-green").
//
// Uso (desde la carpeta del proyecto):  swift scripts/procesar_fotos.swift [--fondo-blanco]
// O haz doble clic en "Preparar fotos.command".

import CoreImage
import Foundation
import Vision

let usarFondoBlanco = CommandLine.arguments.contains("--fondo-blanco")
let ladoMaxOriginal: CGFloat = 1600  // lado más largo de la foto grande (modo original)
let ladoMini: CGFloat = 600       // tarjetas del catálogo
let lado: CGFloat = 1200          // tamaño final (px), cuadrado (modo fondo blanco)
let margen: CGFloat = 0.09        // espacio alrededor del producto
let toleranciaBorde = 0.006       // % del ancho/alto para decidir que "toca el borde"
let calidadJPEG = 0.82
let extensiones: Set = ["jpg", "jpeg", "heic", "png"]

let fm = FileManager.default
let raiz = URL(fileURLWithPath: fm.currentDirectoryPath)
let origen = raiz.appendingPathComponent("fotos-originales")
let destino = raiz.appendingPathComponent("assets/productos")
let ctx = CIContext()
let lienzo = CGRect(x: 0, y: 0, width: lado, height: lado)

enum Modo { case fondoBlanco, original }

func slug(_ s: String) -> String {
  let base = s.folding(options: [.diacriticInsensitive, .caseInsensitive], locale: nil).lowercased()
  let partes = base.split(whereSeparator: { !($0.isASCII && ($0.isLetter || $0.isNumber)) })
  return partes.joined(separator: "-")
}

// Caja que encierra la parte visible de la máscara (en coordenadas de CIImage).
func cajaDeContenido(_ mascara: CVPixelBuffer) -> CGRect? {
  CVPixelBufferLockBaseAddress(mascara, .readOnly)
  defer { CVPixelBufferUnlockBaseAddress(mascara, .readOnly) }
  let ancho = CVPixelBufferGetWidth(mascara), alto = CVPixelBufferGetHeight(mascara)
  let bytesFila = CVPixelBufferGetBytesPerRow(mascara)
  guard let base = CVPixelBufferGetBaseAddress(mascara) else { return nil }
  var minX = ancho, minY = alto, maxX = -1, maxY = -1
  for y in stride(from: 0, to: alto, by: 2) {
    let fila = (base + y * bytesFila).assumingMemoryBound(to: Float32.self)
    for x in stride(from: 0, to: ancho, by: 2) where fila[x] > 0.5 {
      minX = min(minX, x); maxX = max(maxX, x)
      minY = min(minY, y); maxY = max(maxY, y)
    }
  }
  guard maxX >= 0 else { return nil }
  // Las filas del buffer van de arriba hacia abajo; CIImage tiene el origen abajo.
  return CGRect(x: minX, y: alto - maxY - 1, width: maxX - minX + 1, height: maxY - minY + 1)
}

func tocaBorde(_ caja: CGRect, _ total: CGRect) -> Bool {
  let tx = total.width * toleranciaBorde, ty = total.height * toleranciaBorde
  return caja.minX <= tx || caja.minY <= ty || caja.maxX >= total.width - tx || caja.maxY >= total.height - ty
}

// Foto recortada al centro en cuadrado de `tam` px.
func cuadrado(_ foto: CIImage, _ tam: CGFloat = lado) -> CIImage {
  let e = foto.extent, l = min(e.width, e.height)
  let escala = tam / l
  return foto
    .cropped(to: CGRect(x: e.minX + (e.width - l) / 2, y: e.minY + (e.height - l) / 2, width: l, height: l))
    .transformed(by: .init(translationX: -(e.minX + (e.width - l) / 2), y: -(e.minY + (e.height - l) / 2)))
    .transformed(by: .init(scaleX: escala, y: escala))
    .cropped(to: CGRect(x: 0, y: 0, width: tam, height: tam))
}

// Foto completa, achicada para que su lado más largo no pase de `maximo` (nunca la agranda).
func achicada(_ foto: CIImage, _ maximo: CGFloat) -> CIImage {
  let e = foto.extent
  let escala = min(1, maximo / max(e.width, e.height))
  guard escala < 1 else { return foto }
  let salida = foto.applyingFilter("CILanczosScaleTransform", parameters: [kCIInputScaleKey: escala, kCIInputAspectRatioKey: 1])
  return salida.cropped(to: CGRect(x: 0, y: 0, width: (e.width * escala).rounded(.down), height: (e.height * escala).rounded(.down)))
}

func guardarJPEG(_ imagen: CIImage, _ url: URL) throws {
  // Sin metadatos: la foto publicada no debe llevar GPS, modelo del teléfono ni fecha.
  try ctx.writeJPEGRepresentation(
    of: imagen.settingProperties([:]), to: url, colorSpace: CGColorSpace(name: CGColorSpace.sRGB)!,
    options: [CIImageRepresentationOption(rawValue: kCGImageDestinationLossyCompressionQuality as String): calidadJPEG])
}

func sobreFondoBlanco(_ foto: CIImage, mascara: CVPixelBuffer, caja: CGRect) -> CIImage {
  let recorte = foto
    .applyingFilter("CIBlendWithMask", parameters: [
      kCIInputBackgroundImageKey: CIImage.empty(),
      kCIInputMaskImageKey: CIImage(cvPixelBuffer: mascara),
    ])
    .cropped(to: caja)

  // Escalar y centrar en el lienzo cuadrado.
  let escala = lado * (1 - 2 * margen) / max(caja.width, caja.height)
  let w = caja.width * escala, h = caja.height * escala
  let centrado = recorte
    .transformed(by: .init(translationX: -caja.minX, y: -caja.minY))
    .transformed(by: .init(scaleX: escala, y: escala))
    .transformed(by: .init(translationX: (lado - w) / 2, y: (lado - h) / 2))

  // Sombra suave debajo del producto.
  let sombra = centrado
    .applyingFilter("CIColorMatrix", parameters: [
      "inputRVector": CIVector(x: 0, y: 0, z: 0, w: 0),
      "inputGVector": CIVector(x: 0, y: 0, z: 0, w: 0),
      "inputBVector": CIVector(x: 0, y: 0, z: 0, w: 0),
      "inputAVector": CIVector(x: 0, y: 0, z: 0, w: 0.22),
    ])
    .applyingGaussianBlur(sigma: 14)
    .transformed(by: .init(translationX: 0, y: -14))

  return centrado
    .composited(over: sombra)
    .composited(over: CIImage(color: .white).cropped(to: lienzo))
    .cropped(to: lienzo)
}

func procesar(_ url: URL, a salida: URL) throws -> Modo {
  guard var foto = CIImage(contentsOf: url, options: [.applyOrientationProperty: true]) else {
    throw CocoaError(.fileReadCorruptFile)
  }
  foto = foto.transformed(by: .init(translationX: -foto.extent.minX, y: -foto.extent.minY))

  var final = achicada(foto, ladoMaxOriginal)
  var modo = Modo.original
  if usarFondoBlanco {
    final = cuadrado(foto)
    let handler = VNImageRequestHandler(ciImage: foto)
    let pedido = VNGenerateForegroundInstanceMaskRequest()
    if (try? handler.perform([pedido])) != nil, let resultado = pedido.results?.first,
       let mascara = try? resultado.generateScaledMaskForImage(forInstances: resultado.allInstances, from: handler),
       let caja = cajaDeContenido(mascara), !tocaBorde(caja, foto.extent) {
      final = sobreFondoBlanco(foto, mascara: mascara, caja: caja)
      modo = .fondoBlanco
    }
  }

  try guardarJPEG(final, salida)
  let mini = salida.deletingPathExtension().lastPathComponent + "-mini.jpg"
  try guardarJPEG(cuadrado(final, ladoMini), salida.deletingLastPathComponent().appendingPathComponent(mini))
  return modo
}

// ---- Programa principal ----
guard fm.fileExists(atPath: origen.path) else {
  try fm.createDirectory(at: origen, withIntermediateDirectories: true)
  print("📁 Creé la carpeta fotos-originales/. Pon ahí una carpeta por producto y vuelve a ejecutar.")
  exit(0)
}
try fm.createDirectory(at: destino, withIntermediateDirectories: true)

// IDs válidos, leídos de data/productos.js
let productosJS = (try? String(contentsOf: raiz.appendingPathComponent("data/productos.js"), encoding: .utf8)) ?? ""
let patronId = try Regex(#"id:\s*"([^"]+)""#)
let ids = Set(productosJS.matches(of: patronId).compactMap { $0.output[1].substring.map(String.init) })

var fotos: [String: [String]] = [:]
var errores = 0
let carpetas = try fm.contentsOfDirectory(at: origen, includingPropertiesForKeys: [.isDirectoryKey])
  .filter { (try? $0.resourceValues(forKeys: [.isDirectoryKey]).isDirectory) == true }
  .sorted { $0.lastPathComponent < $1.lastPathComponent }

for carpeta in carpetas {
  let id = slug(carpeta.lastPathComponent)
  if !ids.contains(id) {
    print("⚠️  \(id): no existe un producto con ese id en data/productos.js (se procesa igual)")
  }
  let imagenes = try fm.contentsOfDirectory(at: carpeta, includingPropertiesForKeys: nil)
    .filter { extensiones.contains($0.pathExtension.lowercased()) }
    .sorted { $0.lastPathComponent.localizedStandardCompare($1.lastPathComponent) == .orderedAscending }
  guard !imagenes.isEmpty else { continue }

  // Borrar las fotos generadas antes para este producto (solo "<id>-N.jpg" y "<id>-N-mini.jpg",
  // para no tocar otro producto cuyo id empiece igual, ej. switch-oled-white-used).
  let generada = try Regex("^\(id)-[0-9]+(-mini)?\\.jpg$")
  for viejo in try fm.contentsOfDirectory(atPath: destino.path) where viejo.wholeMatch(of: generada) != nil {
    try fm.removeItem(at: destino.appendingPathComponent(viejo))
  }

  print("🎮 \(id) (\(imagenes.count) fotos)")
  var generadas: [(nombre: String, modo: Modo)] = []
  for imagen in imagenes {
    let nombre = "\(id)-\(generadas.count + 1).jpg"
    do {
      let modo = try procesar(imagen, a: destino.appendingPathComponent(nombre))
      generadas.append((nombre, modo))
      let kb = ((try? destino.appendingPathComponent(nombre).resourceValues(forKeys: [.fileSizeKey]).fileSize) ?? 0) / 1024
      print("   \(modo == .fondoBlanco ? "✅ fondo blanco " : "📷 foto original") \(imagen.lastPathComponent) → \(nombre) (\(kb) KB)")
    } catch {
      errores += 1
      print("   ❌ \(imagen.lastPathComponent): no se pudo abrir")
    }
  }
  // Portada: la primera con fondo blanco.
  if let i = generadas.firstIndex(where: { $0.modo == .fondoBlanco }), i > 0 {
    generadas.insert(generadas.remove(at: i), at: 0)
  }
  fotos[id] = generadas.map { "assets/productos/\($0.nombre)" }
}

// Escribir data/fotos.js
let version = Int(Date().timeIntervalSince1970)
let lineas = fotos.keys.sorted().map { id in
  let lista = fotos[id]!.map { "\"\($0)?v=\(version)\"" }.joined(separator: ", ")
  return "  \"\(id)\": [\(lista)],"
}
let js = """
  // Generado por scripts/procesar_fotos.swift. No editar a mano: vuelve a ejecutar el script.
  window.FOTOS = {
  \(lineas.joined(separator: "\n"))
  };

  """
try js.write(to: raiz.appendingPathComponent("data/fotos.js"), atomically: true, encoding: .utf8)

let total = fotos.values.reduce(0) { $0 + $1.count }
print("\n✨ Listo: \(total) fotos en \(fotos.count) productos\(errores > 0 ? ", \(errores) con error" : "").")
