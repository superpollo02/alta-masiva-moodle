# Protocolo de Matriculación Masiva en Moodle - ESalud Mendoza

Guía interactiva, validador y manual oficial para la matriculación masiva de usuarios y control de calidad en el Campus Virtual ESalud (Ministerio de Salud de Mendoza).

## 🚀 Características Principales

1. **Protocolo Instructivo Paso a Paso:**
   - Detalle estructurado de cada fase del proceso institucional de matriculación masiva.
   - Listas de verificación interactiva de tareas completadas y progreso guardado.
   
2. **Video Tutorial Sincronizado:**
   - Reproductor interactivo sincronizado con los momentos clave y transcripción oficial del instructivo en video.

3. **Validador & Generador CSV:**
   - Herramienta inteligente para validar archivos CSV antes de subirlos a Moodle.
   - Generador automático de estructuras de datos correctas (columnas `username`, `password`, `firstname`, `lastname`, `email`, `course1`, `role1`).

4. **Solución de Errores (Troubleshooting):**
   - Asistente de búsqueda y diagnóstico para errores frecuentes de formato, correos duplicados, codificación UTF-8 y claves incorrectas.

5. **Simulador Interactivo:**
   - Entorno guiado para practicar la simulación del proceso de carga e inscripción masiva.

6. **Glosario Técnico:**
   - Definiciones clave sobre Moodle, CSV, roles de usuario, cohortes y métodos de matriculación.

7. **Buscador Global:**
   - Barra de búsqueda rápida en la barra de navegación para encontrar secciones, errores o términos al instante.

8. **Soporte Offline (PWA & Electron):**
   - **Service Worker:** Permite el uso completo de la aplicación sin conexión a internet mediante caché inteligente.
   - **Escritorio Portable:** Configuración lista para empaquetar como ejecutable nativo de Windows (`.exe`) mediante Electron.

---

## 🛠️ Requisitos e Instalación Local

Asegúrate de tener instalado [Node.js](https://nodejs.org/) (versión 18 o superior).

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Iniciar servidor de desarrollo:**
   ```bash
   npm run dev
   ```
   La aplicación se abrirá en `http://localhost:3000`.

3. **Compilar para producción:**
   ```bash
   npm run build
   ```

4. **Empaquetar aplicación de escritorio (Windows Portable):**
   ```bash
   npm run electron:build
   ```
   *(Genera el paquete ejecutable en la carpeta `release/`).*

---

## 📂 Estructura del Proyecto

- `src/components/`: Componentes principales de la interfaz (Navbar, Breadcrumb, ProtocolViewer, CsvGenerator, Troubleshooting, ProcessSimulator, Glossary, VideoTutorial, SearchBar).
- `src/data/`: Datos estructurados del manual, errores, glosario y buscador.
- `public/`: Archivos estáticos, manifiesto PWA y Service Worker (`sw.js`).
- `electron/`: Proceso principal de Electron para la versión de escritorio.

---

## 📄 Licencia y Uso
Desarrollado para el Ministerio de Salud de Mendoza - ESalud. Uso institucional.
