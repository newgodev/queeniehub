import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const source = '/home/ubuntu/Downloads/centanet_queenie_yeung_public_126_normalized.csv';
const target = path.resolve(here, '../data/properties.json');

function parseCsv(text) {
  const rows = [];
  let row = [], cell = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i], next = text[i + 1];
    if (quoted) {
      if (c === '"' && next === '"') { cell += '"'; i++; }
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
    else if (c !== '\r') cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const headers = rows.shift().map(h => h.replace(/^\ufeff/, ''));
  return rows.filter(r => r.length && r.some(Boolean)).map(r => Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ''])));
}

const csv = fs.readFileSync(source, 'utf8');
const raw = parseCsv(csv);
const categoryLabel = { sale: '出售', rent: '放租', new_property: '新盤', project: '項目' };
const slugPart = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-').replace(/^-|-$/g, '');
const data = raw.map((r, index) => ({
  id: r.property_id,
  propertyNo: r.property_no,
  name: r.property_name,
  nameEn: r.property_name_en,
  address: r.address,
  district: r.district,
  zone: r.zone,
  usage: r.usage,
  floor: r.floor_public,
  size: r.size_display,
  sizeValue: Number(r.size || 0),
  price: r.price_display,
  rent: r.rent_display,
  unitPrice: r.unit_price_display,
  category: r.category,
  categoryLabel: categoryLabel[r.category] || '樓盤',
  tags: (r.tags || '').split(' | ').filter(Boolean),
  withLease: String(r.with_lease).toLowerCase() === 'true',
  publishDate: r.publish_date,
  sourcePage: r.source_page,
  retrievedAt: r.retrieved_at,
  slug: `${slugPart(r.district)}-${slugPart(r.property_name)}-${slugPart(r.property_no)}-${index + 1}`
}));
fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target, JSON.stringify(data, null, 2));
console.log(`Imported ${data.length} public listings to ${target}`);
