// Vercel serverless function que hace de proxy a Airtable
// La API key nunca se expone al cliente

export default async function handler(req, res) {
  const AIRTABLE_KEY = process.env.AIRTABLE_KEY;
  const AIRTABLE_BASE = process.env.AIRTABLE_BASE;

  if (!AIRTABLE_KEY || !AIRTABLE_BASE) {
    return res.status(500).json({ error: 'Missing AIRTABLE_KEY or AIRTABLE_BASE env vars' });
  }

  const { op, table, date, dateStart, dateEnd, recordId, fields } = req.method === 'POST' ? req.body : req.query;

  const headers = {
    'Authorization': 'Bearer ' + AIRTABLE_KEY,
    'Content-Type': 'application/json'
  };

  try {
    if (op === 'list') {
      let formula;
      if (date) {
        formula = `DATESTR({Fecha})='${date}'`;
      } else if (dateStart && dateEnd) {
        formula = `AND(DATESTR({Fecha})>='${dateStart}',DATESTR({Fecha})<='${dateEnd}')`;
      } else {
        return res.status(400).json({ error: 'Missing date or dateStart/dateEnd' });
      }
      const base = `https://api.airtable.com/v0/${AIRTABLE_BASE}/${encodeURIComponent(table)}?filterByFormula=${encodeURIComponent(formula)}&pageSize=100`;
      const records = [];
      let offset;
      do {
        const url = base + (offset ? `&offset=${encodeURIComponent(offset)}` : '');
        const r = await fetch(url, { headers });
        const json = await r.json();
        if (!r.ok || json.error) return res.status(r.status).json(json);
        if (json.records) records.push(...json.records);
        offset = json.offset;
      } while (offset);
      return res.status(200).json({ records });
    }

    if (op === 'upsert') {
      const base = `https://api.airtable.com/v0/${AIRTABLE_BASE}/${encodeURIComponent(table)}`;
      const url = recordId ? (base + '/' + recordId) : base;
      const method = recordId ? 'PATCH' : 'POST';
      const r = await fetch(url, {
        method,
        headers,
        body: JSON.stringify({ fields, typecast: true })
      });
      const json = await r.json();
      return res.status(r.status).json(json);
    }

    if (op === 'delete') {
      const url = `https://api.airtable.com/v0/${AIRTABLE_BASE}/${encodeURIComponent(table)}/${recordId}`;
      const r = await fetch(url, { method: 'DELETE', headers });
      const json = await r.json();
      return res.status(r.status).json(json);
    }

    return res.status(400).json({ error: 'Operación no válida' });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
