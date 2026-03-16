# Calculadora de Inversión Meta — Serrano & Bustamante

## Descripción general

Plataforma web de una sola página (SPA) diseñada para estimar el rendimiento de campañas publicitarias en Meta (Facebook/Instagram) para la empresa Serrano & Bustamante. Permite a los usuarios simular distintos escenarios de inversión y visualizar los resultados esperados en tiempo real.

No requiere backend ni base de datos. Todo el cálculo se ejecuta en el navegador del cliente.

---

## Stack tecnológico

- **HTML5** — Estructura semántica del documento
- **CSS3** — Estilos con variables CSS (custom properties), media queries para responsive y soporte nativo de modo oscuro via `prefers-color-scheme`
- **JavaScript vanilla** — Lógica de cálculo, renderizado dinámico del DOM y manejo de eventos
- **Chart.js 4.4.1** — Librería externa cargada por CDN para el gráfico de barras

---

## Arquitectura del archivo

Todo está contenido en un único archivo `index.html` con tres secciones embebidas:

1. **`<style>`** — Sistema de diseño completo con variables CSS, estilos de componentes y media queries
2. **`<body>`** — Estructura HTML con contenedores para cada sección de la interfaz
3. **`<script>`** — Lógica de la aplicación, datos por defecto y funciones de renderizado

---

## Modelo de datos

### Rubros (array `RUBROS_DEFAULT`)

Cada rubro representa una línea de negocio o campaña publicitaria con los siguientes campos:

| Campo  | Tipo   | Descripción                                           |
|--------|--------|-------------------------------------------------------|
| `name` | string | Nombre del rubro (ej: "Papel Tapiz — DM")            |
| `obj`  | string | Tipo de objetivo de la campaña                        |
| `pct`  | number | Porcentaje del presupuesto asignado (0-100)           |
| `cpl`  | number | Costo por lead/resultado en dólares                   |
| `type` | string | Categoría visual: `conv`, `lead` o `ig`               |

### Rubros configurados por defecto (7 rubros)

1. **Papel Tapiz — DM** (15%, CPL $0.60) → Conversaciones por mensaje directo
2. **Papel Tapiz — Formulario** (15%, CPL $1.90) → Leads por formulario
3. **Iluminación — Formulario** (15%, CPL $1.90) → Leads por formulario
4. **Mobiliario — Formulario** (15%, CPL $1.90) → Leads por formulario
5. **Diseño / Remodelación** (15%, CPL $2.50) → Leads por formulario
6. **Domótica — Formulario** (15%, CPL $1.90) → Leads por formulario
7. **Seguidores en IG** (10%, CPL $0.05) → Crecimiento de seguidores

### Variables globales

- `budget` — Presupuesto mensual en dólares (default: 1000)
- `rubros` — Array mutable con la configuración actual de cada rubro
- `chart` — Instancia activa de Chart.js (se destruye y recrea en cada render)

---

## Fórmulas de cálculo

```
Inversión por rubro = budget × (pct / 100)
Resultados estimados = Math.round(Inversión por rubro / cpl)
```

### Métricas agregadas

- **Conversaciones (DM)** = resultados del rubro índice 0
- **Leads formulario** = suma de resultados de rubros índices 1 a 5
- **Seguidores IG** = resultados del rubro índice 6
- **Total resultados** = Conversaciones + Leads (no incluye seguidores)

---

## Componentes de la interfaz

### 1. Header

- Título: "Calculadora de inversión Meta"
- Subtítulo: "Serrano & Bustamante — Estimaciones de rendimiento"
- Nota de disclaimer en esquina superior derecha

### 2. Selector de presupuesto

- **Botones preset**: $600, $1,000, $1,500 — aplican el presupuesto y resetean los rubros a valores por defecto
- **Botón "Personalizado"**: se activa automáticamente al usar el slider o el input manual
- **Slider (range)**: rango de $200 a $5,000 en pasos de $50
- **Input numérico**: permite valores de $200 a $50,000 (el slider se limita a $5,000 pero el input acepta valores mayores)

### 3. Tabla de distribución por rubro

Cada fila muestra:
- Nombre del rubro
- Badge de objetivo (Conversación / Lead / Seguidor) con colores diferenciados
- **% de inversión** — campo editable que redistribuye el presupuesto
- **Inversión calculada** — monto en dólares (solo lectura)
- **CPL aproximado** — campo editable para ajustar el costo por resultado
- **Resultados estimados** — cantidad calculada automáticamente (solo lectura)

Fila de totales al final con suma de porcentajes, inversión y resultados.

**Validación**: si los porcentajes no suman 100%, aparece una advertencia en rojo debajo de la tabla.

### 4. Tarjetas de métricas

Cinco tarjetas en fila horizontal (responsive a 2 columnas en móvil):
- Inversión mensual (presupuesto total)
- Conversaciones por DM
- Leads por formulario (5 rubros)
- Seguidores IG
- Total resultados (conversaciones + leads)

### 5. Gráfico de barras

- Renderizado con Chart.js
- Una barra por rubro con colores diferenciados
- Leyenda personalizada con puntos de color sobre el gráfico
- Tooltip al hacer hover mostrando cantidad de resultados
- Eje X con nombres truncados a 20 caracteres
- Eje Y comienza en cero
- Se destruye y recrea en cada actualización para evitar memory leaks

---

## Funciones principales

| Función            | Descripción                                                        |
|--------------------|--------------------------------------------------------------------|
| `calcResults()`    | Calcula inversión y resultados para cada rubro                     |
| `renderTable()`    | Genera el HTML de la tabla con datos actuales                      |
| `renderMetrics()`  | Genera las tarjetas de métricas agregadas                          |
| `renderChart()`    | Destruye el gráfico anterior y crea uno nuevo con datos actuales   |
| `render()`         | Ejecuta las tres funciones de renderizado en secuencia             |
| `updatePct(i,val)` | Actualiza el porcentaje del rubro `i` y re-renderiza               |
| `updateCpl(i,val)` | Actualiza el CPL del rubro `i` y re-renderiza                     |
| `setPreset(val)`   | Aplica un presupuesto preset, resetea rubros y actualiza la UI     |
| `setCustomActive()`| Marca el botón "Personalizado" como activo                        |
| `onSlider(val)`    | Maneja el cambio del slider de presupuesto                         |
| `onInput(val)`     | Maneja el cambio del input numérico de presupuesto                 |

---

## Sistema de diseño

### Temas

La plataforma soporta **modo claro y modo oscuro** automáticamente según la preferencia del sistema operativo del usuario (`prefers-color-scheme: dark`).

### Variables CSS principales

| Variable           | Claro         | Oscuro         | Uso                        |
|--------------------|---------------|----------------|----------------------------|
| `--bg-primary`     | `#ffffff`     | `#1e1e1c`      | Fondo de cards             |
| `--bg-secondary`   | `#f5f5f3`     | `#2a2a28`      | Fondo de página y totales  |
| `--bg-info`        | `#E6F1FB`     | `#0C447C`      | Botones activos            |
| `--text-primary`   | `#1a1a18`     | `#f0ede8`      | Texto principal            |
| `--text-secondary` | `#6b6b66`     | `#9a9990`      | Texto secundario/labels    |
| `--text-danger`    | `#A32D2D`     | `#F09595`      | Advertencias               |

### Badges de objetivo

| Tipo   | Clase        | Color claro              | Color oscuro              |
|--------|-------------|--------------------------|---------------------------|
| conv   | badge-conv  | fondo verde, texto verde | fondo verde oscuro        |
| lead   | badge-lead  | fondo azul, texto azul   | fondo azul oscuro         |
| ig     | badge-ig    | fondo ámbar, texto ámbar | fondo ámbar oscuro        |

### Colores del gráfico

Array fijo de 7 colores: `#1D9E75`, `#378ADD`, `#5DCAA5`, `#185FA5`, `#BA7517`, `#3B6D11`, `#EF9F27`

### Responsive

- **Desktop**: layout completo en una columna de 900px max-width
- **Móvil (< 540px)**: header apilado verticalmente, métricas en grid de 2 columnas
- **Tabla**: scroll horizontal cuando el contenido excede el ancho disponible

---

## Dependencias externas

| Recurso   | URL CDN                                                              | Versión |
|-----------|----------------------------------------------------------------------|---------|
| Chart.js  | `cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js`       | 4.4.1   |

No hay otras dependencias. No se usa npm, bundler ni framework.

---

## Notas técnicas

- Toda la UI se re-renderiza completamente en cada cambio (approach de renderizado declarativo)
- El gráfico Chart.js se destruye (`chart.destroy()`) antes de crear uno nuevo para evitar fugas de memoria
- Los inputs de porcentaje aceptan 0-100, los de CPL aceptan desde 0.01
- Si un CPL es 0 o negativo, se fuerza a 0.01 para evitar divisiones por cero
- La fuente principal es Inter, con fallback a system-ui y sans-serif
