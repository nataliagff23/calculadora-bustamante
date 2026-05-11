# Plataforma Serrano & Bustamante

## Descripción general

Plataforma web con dos secciones:
1. **Calculadora de inversión Meta** — Estima el rendimiento de campañas publicitarias en Meta
2. **Control de leads** — Registro diario de prospectos por vendedora y rubro, con métricas semanales y mensuales

Frontend: SPA en un único archivo `index.html` servido como sitio estático desde Vercel.
Backend: Vercel serverless functions en `/api/` para proxy a Airtable.

---

## Stack tecnológico

- **HTML5 / CSS3 / JavaScript vanilla** — todo en `index.html`
- **Chart.js 4.4.1** — gráfico de barras (CDN)
- **Chart.js datalabels plugin 2.2.0** — etiquetas sobre barras (CDN)
- **Vercel serverless functions** (`/api/airtable.js`) — proxy a Airtable usando `fetch` nativo de Node
- **Airtable** — base de datos (via REST API)

No se usa npm, bundler ni framework. Las dependencias del cliente se cargan por CDN.

---

## Despliegue

- **GitHub:** `nataliagff23/calculadora-bustamante` (rama `main`)
- **Vercel:** auto-deploy desde `main`. La carpeta `/api/` se despliega automáticamente como serverless functions
- **Variables de entorno en Vercel:**
  - `AIRTABLE_KEY` — Personal Access Token de Airtable (scopes: `data.records:read`, `data.records:write`, con acceso al base específico)
  - `AIRTABLE_BASE` — `appC0laa43S7rNjhC`

Después de cambiar una env var, hay que **redeploy manual** desde Vercel para que tome efecto.

---

## Estructura de archivos

```
/
├── index.html          # SPA completa
├── api/
│   └── airtable.js     # Serverless proxy a Airtable
├── apps-script.js      # (legado, no se usa) — Google Apps Script anterior
└── CLAUDE.md
```

---

## Sección 1: Calculadora de inversión

### Modelo de datos

Array `RUBROS_DEFAULT` con 7 rubros. Cada rubro tiene:
| Campo | Tipo | Descripción |
|---|---|---|
| `name` | string | Nombre del rubro |
| `obj` | string | Tipo de objetivo |
| `pct` | number | % del presupuesto (0-100) |
| `cpl` | number | Costo por lead en USD |
| `type` | string | `conv`, `lead` o `ig` |

**Rubros configurados (7):**
1. Papel Tapiz — DM (15%, $0.60, conv)
2. Papel Tapiz — Formulario (15%, $1.90, lead)
3. Iluminación — Formulario (15%, $1.90, lead)
4. Mobiliario — Formulario (15%, $1.90, lead)
5. Diseño / Remodelación (15%, $2.50, lead)
6. Domótica — Formulario (15%, $1.90, lead)
7. Seguidores en IG (10%, $0.05, ig)

### Fórmulas

```
inversión por rubro = budget × (pct / 100)
resultados estimados = round(inversión / cpl)
```

**Métricas agregadas:**
- Conversaciones (DM) = resultados del rubro 0
- Leads formulario = suma rubros 1 a 5
- Seguidores IG = rubro 6
- Total = conversaciones + leads (excluye seguidores)

### UI

- **Selector de presupuesto:** botones preset ($600, $1000, $1500), slider ($200-$5000) e input numérico ($200-$50000)
- **Tabla editable:** por rubro con % inversión y CPL ajustables en tiempo real
- **5 tarjetas de métricas** y **gráfico de barras** con datalabels y tooltip

---

## Sección 2: Control de leads

### Modelo de datos

Los datos se almacenan **por día**. Cada día tiene:

```js
{
  vendors: {
    Sabrina:  { prospectos, instagram, showroom, respondidos, interes, citas, cierres },
    Tahiruma: { ... },
    Paola:    { ... },
    Mariam:   { ... }
  },
  rubros: {
    "Diseño de Interiores": { Sabrina, Tahiruma, Paola, Mariam },
    "Iluminación": { ... },
    "Papel Tapiz": { ... },
    "Domótica": { ... },
    "Mobiliario": { ... },
    "Sonido": { ... },
    "Propiedades": { ... },
    "Otros": { ... }
  }
}
```

**Vendedoras:** `['Sabrina', 'Tahiruma', 'Paola', 'Mariam']`
**Columnas por vendedora:** `['prospectos', 'instagram', 'showroom', 'respondidos', 'interes', 'citas', 'cierres']`
**Rubros:** `['Diseño de Interiores', 'Iluminación', 'Papel Tapiz', 'Domótica', 'Mobiliario', 'Sonido', 'Propiedades', 'Otros']`

### Persistencia

**Airtable es la fuente de verdad.** localStorage se usa como caché local para render rápido.

- Al cargar un día: pinta el caché local inmediatamente, luego consulta Airtable. Si Airtable tiene datos, los usa. Si está vacío, limpia el caché local.
- Al escribir: guarda en localStorage al instante, y después de 2 segundos de debounce envía todo el día a Airtable.
- `clearDay()` borra tanto el caché local como todos los registros del día en Airtable.

### UI

- **Selector de fecha** con flechas y `<input type="date">`
- **Tabla de vendedoras** — filas Sabrina/Tahiruma/Paola/Mariam, columnas editables, fila TOTAL automática
- **Tabla de rubros** — filas por rubro, columnas Sabrina/Tahiruma/Paola/Mariam, columna TOTAL por fila
- **Resumen semanal** — 9 tarjetas con selector de semana (flechas izq/der). Incluye totales + rubro top + vendedora top (basada en citas+cierres) + tasa de respuesta
- **Resumen mensual** — 9 tarjetas con selector de mes (flechas izq/der). Similar al semanal + tasa de cierre
- **Botón "Limpiar día actual"** — borra local y Airtable

### Funciones clave

| Función | Descripción |
|---|---|
| `loadDay()` | Cambia de día, carga de localStorage + sync con Airtable |
| `renderDayUI(data)` | Re-renderiza los inputs (solo al cambiar de día) |
| `onVendorInput(el)` | Guarda input de vendedora, actualiza totales sin re-renderizar |
| `onRubroInput(el)` | Guarda input de rubro, actualiza total de fila |
| `scheduleSave(date)` | Debounce de 2s y llama `saveToAirtable` |
| `saveToAirtable(date)` | Lista registros del día, hace upsert de 4 vendedoras + 8 rubros |
| `loadFromAirtable(date)` | Consulta Airtable y devuelve estructura `{vendors, rubros}` |
| `aggregateDays(dates)` | Suma totales + calcula top rubro/vendedora/tasas |
| `renderSummaries()` | Pinta resumen semanal y mensual |
| `moveDay(dir)` / `moveWeek(dir)` / `moveMonth(dir)` | Navegación |

### Actualización parcial del DOM

**Nunca se re-renderiza la tabla de inputs mientras el usuario escribe.** Los inputs usan `oninput` que llama a `onVendorInput` / `onRubroInput`. Estas funciones:
1. Guardan en localStorage
2. Disparan el debounce de Airtable
3. Actualizan solo los totales (`.vt-*` y `.rt-*`) vía `textContent`
4. Re-renderizan los resúmenes semanales/mensuales (que no contienen inputs)

Esto evita el bug común donde el re-render destruye el input activo y se pierde el foco/cursor.

---

## Airtable

### Base
- **Nombre:** Bustamante
- **ID:** `appC0laa43S7rNjhC`

### Tabla `Vendedoras` (ID: `tblA9qwrSJTn63GYb`)

| Columna | Tipo |
|---|---|
| Fecha | Date |
| Vendedora | Single select (Sabrina, Tahiruma, Paola, Mariam) |
| Prospectos Totales | Number |
| Instagram | Number |
| Showroom | Number |
| Respondidos | Number |
| Interés Alto | Number |
| Citas | Number |
| Cierres | Number |

### Tabla `Rubros` (ID: `tbltdJfwYgorPeR8L`)

| Columna | Tipo |
|---|---|
| Fecha | Date |
| Rubro | Single select (los 8 rubros) |
| Sabrina | Number |
| Tahiruma | Number |
| Paola | Number |
| Mariam | Number |

### Mapeo de nombres

En el frontend, los nombres internos (lowercase) se mapean a los de Airtable en `FIELD_MAP_VENDOR`:

```js
{
  prospectos: 'Prospectos Totales',
  instagram: 'Instagram',
  showroom: 'Showroom',
  respondidos: 'Respondidos',
  interes: 'Interés Alto',   // importante: con acento
  citas: 'Citas',
  cierres: 'Cierres'
}
```

### Filtro por fecha

Airtable almacena las fechas como datetime. Para filtrar por día se usa:
```
filterByFormula=DATESTR({Fecha})='2026-03-31'
```

Esto es crítico — `{Fecha}='2026-03-31'` NO funciona con campos Date de Airtable.

### Typecast

Los upserts usan `typecast: true` para que Airtable cree automáticamente las opciones de Single select si no existen (ej: agregar un nuevo rubro en el código).

---

## Serverless proxy (`/api/airtable.js`)

Función Vercel que recibe POST con `{op, table, date?, recordId?, fields?}` y hace proxy a Airtable con la API key en env var.

**Operaciones soportadas:**
- `op: 'list'` — consulta por fecha con `DATESTR`
- `op: 'upsert'` — POST (nuevo) o PATCH (existente), con `typecast: true`
- `op: 'delete'` — DELETE por recordId

**Razón del proxy:** la API key de Airtable no se expone al cliente. Queda solo en las env vars de Vercel.

---

## Sistema de diseño

### Tema claro

Variables CSS principales:
| Variable | Valor |
|---|---|
| `--bg-primary` | `#ffffff` |
| `--bg-secondary` | `#f5f5f0` |
| `--bg-sidebar` | `#eaeae5` |
| `--bg-info` | `#d6e8fa` |
| `--text-primary` | `#1a1a1a` |
| `--text-secondary` | `#6b6b60` |
| `--text-info` | `#0C447C` |
| `--text-danger` | `#c0392b` |

### Layout

- **Sidebar izquierdo** (200px) con botones de tab: Calculadora / Control de leads
- **Main content** (flex) con max-width 1100px
- En móvil (<768px): sidebar se convierte en tabs horizontales arriba

### Indicador de sincronización

`#syncStatus` muestra el estado de las operaciones con Airtable:
- `⟳ Guardando...` (azul)
- `✓ Guardado` (verde)
- `❌ <mensaje>` (rojo) — muestra el error de Airtable si falla

---

## Problemas conocidos resueltos

1. **Input perdía foco al escribir** — se arregló no re-renderizando las tablas de inputs durante `oninput`, solo los totales y resúmenes
2. **Números concatenados como strings** (`"0" + "10" = "010"`) — forzar `Number()` al cargar de Airtable
3. **`filterByFormula` con fechas** — usar `DATESTR({Fecha})` en lugar de `{Fecha}=`
4. **CORS / POST redirects con Google Apps Script** — migrado a Airtable + proxy serverless de Vercel
5. **API key expuesta** — movida a env var de Vercel con proxy en `/api/airtable.js`
