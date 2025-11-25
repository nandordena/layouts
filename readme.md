# Layouts

Repositorio que centraliza varios layouts para OBS y una consola de control
construida únicamente con HTML, CSS y JavaScript.

## Estructura general

- `index.html`: página de entrada con accesos a cada layout y al panel de control.
- `layouts/`: carpeta donde vive cada layout individual (`l1`, etc.) con su HTML,
  CSS y JS.
- `control/`: panel de control del sistema, compuesto por:
  - `control.html`: interfaz principal.
  - `control.css`: estilos específicos del panel.
  - `control.js`: lógica para sincronizar y escribir la configuración.
  - `cnfg.json`: archivo de configuración que se actualiza con cada acción.

## Panel de control

El panel permite modificar categorías clave del layout sin tocar código:

- **Layout**: modo (grid, split, fullscreen).
- **Pantalla**: estado (activo, pausa, standby) y chroma/brillos con slider.
- **Cámara**: zoom con slider, controles de filtros como brillo contraste y otros, tambien la transparencia
- **Chat**: visibilidad on  y off, opacidad , selector de coler de fondo con slider por hue y transparencia de fondo.
- **Contadores**: lista de contadores con + y - u un campo para definir el numero y el nombre de cada uno, tambien un boton para agregar más contadores con.
- **Escenas especiales**: presets (intro, créditos, pausa, baño, problemas)

Cada categoría se selecciona desde una botonera horizontal. Al elegir un botón,
el panel muestra su set de acciones. Los cambios actualizan un JSON final y se
registran en un log con sello de tiempo.

### Sincronización de `cnfg.json`

1. El panel intenta cargar `control/cnfg.json` al iniciar.
2. Cada acción llama a `control.js`, que:
   - Ajusta la UI (botones activos, slider, etc.).
   - Serializa el objeto de configuración actualizado.
   - Escribe el JSON.
3. Modo de escritura:
   - Si el navegador soporta **File System Access API**, permite vincular
     `cnfg.json` y lo sobreescribe directamente.
   - Si no, genera una descarga automática del archivo.

El estado de sincronización y la hora del último comando se muestran junto a la
botonera. También hay un botón para copiar el JSON y otro para restaurar los
valores base.

## Cómo ejecutar

1. Abre `index.html` en cualquier navegador moderno.
2. Haz clic en "Ir al Control" para abrir el panel.
3. Selecciona una categoría y pulsa los botones deseados.
4. Vincula `cnfg.json` (si el navegador lo admite) o descarga el archivo
   actualizado cada vez que hagas cambios.

No se requiere servidor; basta con servir los archivos de forma estática o abrir
el HTML directamente. Para pruebas locales con soporte a `fetch` y File System
Access se recomienda usar un servidor simple (`npx serve`, `python -m http.server`,
etc.).