# Álvaro Picazo Fisioterapia — Web + Portal del Paciente

Web profesional estática (HTML, CSS y JavaScript puro, sin dependencias) para la
clínica de fisioterapia de Álvaro Picazo, con un **Portal del Paciente** para el
seguimiento de rehabilitaciones (especialmente recuperación de **ligamento cruzado**).

## 🚀 Cómo verla

Es 100% estática: basta con abrir `index.html` en el navegador.
Para que todo funcione perfecto (vídeos, portal, etc.) se recomienda servirla con
un pequeño servidor local:

```bash
# Opción 1: Python
python3 -m http.server 8000

# Opción 2: Node
npx serve .
```

Luego abre `http://localhost:8000`.

## 🔐 Accesos del Portal

Pulsa **"Portal del paciente"** en el menú o ve a `portal.html`:

| Perfil          | Usuario   | Contraseña |
|-----------------|-----------|------------|
| 👤 Paciente     | `cliente` | `123465`   |
| 🩺 Fisioterapeuta | `fisio`   | `123456`   |

- **Paciente:** panel con su progreso, fases de recuperación, ejercicios en vídeo,
  registro de dolor/movilidad y chat con el fisio.
- **Fisioterapeuta (admin):** panel con pacientes, KPIs y **subida de vídeos**
  (YouTube, archivo local o enlace directo). Los vídeos publicados aparecen
  automáticamente en el portal del paciente. Chat por paciente.

### Registro y suscripción (nuevo)

Cualquier visitante puede **crear su cuenta** desde `register.html` (botón
"Suscribirme al portal"):

1. **Datos** de acceso (nombre, email, contraseña).
2. **Tu lesión**: motivo, qué quiere mejorar y dudas/notas para el fisio.
3. **Pago simulado** del **Plan Recuperación — 150€/mes** (no se cobra nada real;
   usa una tarjeta de prueba, p. ej. `4242 4242 4242 4242`).

Tras el pago la cuenta se activa, el paciente accede a su portal y **aparece
automáticamente en el panel del fisioterapeuta**. Si intenta iniciar sesión sin
haber completado el pago, se le redirige a finalizar la suscripción.

## 📁 Estructura

```
.
├── index.html          # Web principal (landing) con tarifas y FAQ
├── portal.html         # Login del portal
├── register.html       # Registro + pago (150€/mes)
├── paciente.html       # Panel del paciente
├── admin.html          # Panel del fisioterapeuta
├── robots.txt          # SEO
├── sitemap.xml         # SEO
├── css/
│   ├── style.css       # Estilos de la web
│   └── portal.css      # Estilos del portal
├── js/
│   ├── knee-gl.js      # Rodilla 3D en WebGL (Three.js)
│   ├── vendor/         # Three.js 0.160 (licencia MIT)
│   ├── main.js         # Animaciones de la web
│   ├── portal-data.js  # Datos, login y almacenamiento (localStorage)
│   ├── portal-ui.js    # Utilidades de interfaz del portal
│   ├── login.js        # Lógica del login
│   ├── register.js     # Registro + pago simulado
│   ├── paciente.js     # Lógica del panel del paciente
│   └── admin.js        # Lógica del panel del fisioterapeuta
└── img/                # Logos, ilustraciones e iconos (SVG)
```

## ✨ Características

- Diseño moderno y responsive con animaciones (scroll reveal, contadores,
  parallax suave, microinteracciones).
- SEO: meta tags, Open Graph, datos estructurados Schema.org (`Physician`),
  `sitemap.xml` y `robots.txt`.
- Portal funcional con dos roles, gestión de vídeos y seguimiento de progreso.
- Sin frameworks ni dependencias: carga rápida y fácil de mantener.

## 🎨 Diseño (línea Clínica Graus)

- Paleta roja/granate sobre casi negro, alineada con Clínica Graus, donde Álvaro
  pasa consulta. Variables en `css/style.css` (`--brand`, `--wine`, `--dark`...).
- **Rodilla 3D en WebGL** (`js/knee-gl.js`, con Three.js incluido en `js/vendor/`):
  - En la portada se flexiona sola y un goniómetro marca el ángulo en vivo.
  - En la sección de ligamento cruzado se gira, se pulsa cada estructura y se
    mueve la flexión con un control deslizante.
  - Si el navegador no tiene WebGL se muestra la versión CSS/SVG de respaldo.
  - Usa módulos JS: hay que abrir la web con un servidor (ver arriba), no con
    doble clic sobre `index.html`.
- Sección «Lesiones de rodilla que trato» y «Cómo trabajamos tu rodilla».
- SEO: título y descripción orientados a «fisioterapeuta rodilla Albacete»,
  datos estructurados (`Physiotherapy`, `Person`, `FAQPage`), Open Graph con
  imagen `img/og-image.jpg` y `sitemap.xml` actualizado.

## 📝 Notas para producción

- **Pendiente:** dirección exacta de Clínica Graus (en `index.html`, marcada con
  `PENDIENTE`) y confirmar horarios.
- Los testimonios, casos de éxito y cifras son de ejemplo: hay que sustituirlos
  por datos reales (con autorización por escrito de los pacientes) o quitarlos.

- Los datos del portal se guardan en `localStorage` (demo). Para producción se
  conectaría una base de datos / backend real y autenticación segura.
- Los vídeos subidos como **archivo** se guardan en el navegador (demo). En
  producción se usaría almacenamiento en la nube (YouTube, Vimeo, S3...).
- Sustituye los datos de contacto/redes y la imagen real de Álvaro cuando estén
  disponibles (carpeta `img/`).

---
© Álvaro Picazo Fisioterapia · Albacete
