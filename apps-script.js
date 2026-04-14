// ============================================
// PEGAR ESTE CÓDIGO EN Google Apps Script
// Cada día crea una hoja nueva con el formato
// exacto del Excel original
// ============================================

function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var p = e.parameter;
  var action = p.action;
  var result;

  try {
    if (action === 'read') {
      result = readDay(ss, p.date);
    } else if (action === 'save') {
      result = saveDay(ss, p);
    } else if (action === 'clearDay') {
      result = clearDay(ss, p.date);
    } else {
      result = { error: 'Acción no válida' };
    }
  } catch (err) {
    result = { error: err.toString() };
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  // POST: los parámetros vienen en e.parameter (FormData)
  return doGet(e);
}

// Nombre de hoja por fecha: "31-Mar"
function sheetName(dateStr) {
  var d = new Date(dateStr + 'T12:00:00');
  var meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  return d.getDate() + '-' + meses[d.getMonth()];
}

// Leer datos de un día
function readDay(ss, dateStr) {
  var name = sheetName(dateStr);
  var sheet = ss.getSheetByName(name);
  if (!sheet) return { found: false };

  var data = sheet.getDataRange().getValues();
  var vendors = {};
  var rubros = {};

  // Leer vendedoras (filas 2-4, después del header en fila 1)
  for (var i = 1; i <= 3; i++) {
    if (i >= data.length) break;
    var row = data[i];
    var vendorName = String(row[0]).trim();
    if (!vendorName) continue;
    vendors[vendorName] = {
      prospectos: Number(row[1]) || 0,
      instagram: Number(row[2]) || 0,
      showroom: Number(row[3]) || 0,
      respondidos: Number(row[4]) || 0,
      interes: Number(row[5]) || 0,
      citas: Number(row[6]) || 0,
      cierres: Number(row[7]) || 0
    };
  }

  // Leer rubros (empiezan en fila 8, después de fila vacía y header de rubros)
  for (var i = 8; i < data.length; i++) {
    var row = data[i];
    var rubroName = String(row[0]).trim();
    if (!rubroName) continue;
    rubros[rubroName] = {
      Sabrina: Number(row[1]) || 0,
      Tahiruma: Number(row[2]) || 0,
      Paola: Number(row[3]) || 0
    };
  }

  return { found: true, vendors: vendors, rubros: rubros };
}

// Guardar datos de un día completo
function saveDay(ss, p) {
  var dateStr = p.date;
  var name = sheetName(dateStr);

  // Parsear JSON de vendors y rubros
  var vendors = JSON.parse(p.vendors);
  var rubros = JSON.parse(p.rubros);

  // Borrar hoja si existe y crear nueva
  var sheet = ss.getSheetByName(name);
  if (sheet) ss.deleteSheet(sheet);
  sheet = ss.insertSheet(name);

  // ── Sección vendedoras ──
  sheet.appendRow(['Vendedora', 'Prospectos Totales', 'Instagram', 'Showroom', 'Respondidos', 'Interés Alto', 'Citas', 'Cierres']);

  var vendorNames = ['Sabrina', 'Tahiruma', 'Paola'];
  var totals = [0, 0, 0, 0, 0, 0, 0];
  var cols = ['prospectos', 'instagram', 'showroom', 'respondidos', 'interes', 'citas', 'cierres'];

  for (var v = 0; v < vendorNames.length; v++) {
    var vn = vendorNames[v];
    var vd = vendors[vn] || {};
    var row = [vn];
    for (var c = 0; c < cols.length; c++) {
      var val = Number(vd[cols[c]]) || 0;
      row.push(val);
      totals[c] += val;
    }
    sheet.appendRow(row);
  }

  // Fila de totales
  var totalRow = ['TOTAL'];
  for (var c = 0; c < totals.length; c++) totalRow.push(totals[c]);
  sheet.appendRow(totalRow);

  // Fila vacía
  sheet.appendRow(['']);

  // ── Sección rubros ──
  sheet.appendRow(['Rubros', 'Cant. Sabrina', 'Cant. Tahiruma', 'Cant. Paola', 'TOTAL']);

  var rubroNames = ['Diseño de Interiores', 'Iluminación', 'Papel Tapiz', 'Domótica', 'Mobiliario', 'Sonido', 'Propiedades', 'Otros'];

  for (var r = 0; r < rubroNames.length; r++) {
    var rn = rubroNames[r];
    var rd = rubros[rn] || {};
    var s = Number(rd['Sabrina']) || 0;
    var t = Number(rd['Tahiruma']) || 0;
    var pa = Number(rd['Paola']) || 0;
    sheet.appendRow([rn, s, t, pa, s + t + pa]);
  }

  // Formato
  sheet.getRange(1, 1, 1, 8).setFontWeight('bold');
  sheet.getRange(5, 1, 1, 8).setFontWeight('bold'); // TOTAL
  sheet.getRange(7, 1, 1, 5).setFontWeight('bold'); // Header rubros
  sheet.setColumnWidth(1, 180);
  for (var c = 2; c <= 8; c++) sheet.setColumnWidth(c, 100);

  return { ok: true, sheet: name };
}

// Limpiar un día
function clearDay(ss, dateStr) {
  var name = sheetName(dateStr);
  var sheet = ss.getSheetByName(name);
  if (sheet) ss.deleteSheet(sheet);
  return { ok: true };
}
