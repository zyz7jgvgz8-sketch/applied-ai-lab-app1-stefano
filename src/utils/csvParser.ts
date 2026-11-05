import { SalesOrder, CSVParseResult } from '../types/sales';

/**
 * Robust RFC 4180 compliant CSV line tokenizer that handles quoted values with commas and escaped quotes.
 */
function parseCSVRows(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let insideQuote = false;
  let i = 0;
  const len = csvText.length;

  while (i < len) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (insideQuote) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote: "" -> "
          currentField += '"';
          i += 2;
          continue;
        } else {
          // Closing quote
          insideQuote = false;
          i++;
          continue;
        }
      } else {
        currentField += char;
        i++;
        continue;
      }
    } else {
      if (char === '"') {
        insideQuote = true;
        i++;
        continue;
      } else if (char === ',') {
        currentRow.push(currentField.trim());
        currentField = '';
        i++;
        continue;
      } else if (char === '\r') {
        if (nextChar === '\n') {
          i++;
        }
        currentRow.push(currentField.trim());
        if (currentRow.some(col => col.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = '';
        i++;
        continue;
      } else if (char === '\n') {
        currentRow.push(currentField.trim());
        if (currentRow.some(col => col.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = '';
        i++;
        continue;
      } else {
        currentField += char;
        i++;
        continue;
      }
    }
  }

  // Final field and row if any
  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some(col => col.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Standardize quarter names: e.g. "Q2", "q2", "Quarter 2", "2024 Q2", "2024-Q2" -> "Q2"
 */
export function normalizeQuarter(raw: string): string {
  const trimmed = raw.trim();
  const match = trimmed.match(/(?:quarter|q)[ -_]?([1-4])/i);
  if (match) {
    return `Q${match[1]}`;
  }
  if (/^[1-4]$/.test(trimmed)) {
    return `Q${trimmed}`;
  }
  return trimmed.toUpperCase();
}

/**
 * Normalizes categorical text (region, channel, product) so case variations
 * like "west", "West", "WEST" do NOT get categorized separately in the data.
 * Standardizes to proper Title Case while preserving standard uppercase acronyms (e.g. EMEA, APAC, LATAM).
 */
export function normalizeCategoryName(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';

  const knownAcronyms = new Set([
    'EMEA',
    'APAC',
    'LATAM',
    'NA',
    'EU',
    'USA',
    'US',
    'UK',
    'DACH',
    'ANZ',
    'B2B',
    'B2C',
    'HQ',
  ]);

  if (knownAcronyms.has(trimmed.toUpperCase())) {
    return trimmed.toUpperCase();
  }

  // Split by whitespace and normalize each word
  return trimmed
    .split(/\s+/)
    .map(word => {
      // Handle hyphenated words like "Asia-Pacific" or "Mid-West"
      if (word.includes('-')) {
        return word
          .split('-')
          .map(sub => {
            const up = sub.toUpperCase();
            if (knownAcronyms.has(up)) return up;
            return sub.charAt(0).toUpperCase() + sub.slice(1).toLowerCase();
          })
          .join('-');
      }

      const upper = word.toUpperCase();
      if (knownAcronyms.has(upper)) return upper;

      // Title case: first letter uppercase, rest lowercase
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

/**
 * Parse numeric currency/revenue strings like "$12,450.50", "12450.5", "($500)"
 */
export function parseRevenue(raw: string): number {
  if (!raw) return 0;
  let str = raw.trim();
  const isNegative = str.startsWith('(') && str.endsWith(')') || str.includes('-');
  str = str.replace(/[$,() ]/g, '').replace(/-/g, '');
  const num = parseFloat(str);
  if (isNaN(num)) return 0;
  return isNegative ? -num : num;
}

/**
 * Parse discount percentage into a standard 0 to 100 percentage number
 * e.g. "15%" -> 15, "0.15" -> 15, "15" -> 15
 */
export function parseDiscount(raw: string): number {
  if (!raw) return 0;
  let str = raw.trim().replace(/[% ]/g, '');
  const num = parseFloat(str);
  if (isNaN(num)) return 0;
  // If provided as a fraction e.g. 0.12, convert to 12%
  if (num > 0 && num <= 1 && raw.includes('.')) {
    return num * 100;
  }
  return num;
}

/**
 * Parse units sold
 */
export function parseUnits(raw: string): number {
  if (!raw) return 0;
  const cleaned = raw.trim().replace(/[, ]/g, '');
  const val = parseInt(cleaned, 10);
  return isNaN(val) ? 0 : val;
}

/**
 * Parse and validate sales CSV file content
 */
export function parseSalesCSV(csvText: string): CSVParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const orders: SalesOrder[] = [];

  const rawRows = parseCSVRows(csvText);
  if (rawRows.length === 0) {
    return {
      orders: [],
      errors: ['The uploaded CSV file is empty.'],
      warnings: [],
      rawRowCount: 0,
      validRowCount: 0,
    };
  }

  // Match headers case-insensitively
  const headerRow = rawRows[0].map(h => h.toLowerCase().replace(/[\s_]/g, ''));

  const findColIndex = (names: string[]): number => {
    for (const name of names) {
      const idx = headerRow.findIndex(h => h === name || h.includes(name));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const quarterIdx = findColIndex(['quarter', 'qtr']);
  const regionIdx = findColIndex(['region', 'territory', 'market']);
  const channelIdx = findColIndex(['channel', 'saleschannel']);
  const productIdx = findColIndex(['product', 'item', 'sku']);
  const unitsIdx = findColIndex(['units', 'unit', 'quantity', 'qty']);
  const discountIdx = findColIndex(['discountpct', 'discount', 'disc']);
  const revenueIdx = findColIndex(['revenue', 'sales', 'amount', 'total']);

  const missingColumns: string[] = [];
  if (quarterIdx === -1) missingColumns.push('quarter');
  if (regionIdx === -1) missingColumns.push('region');
  if (channelIdx === -1) missingColumns.push('channel');
  if (productIdx === -1) missingColumns.push('product');
  if (unitsIdx === -1) missingColumns.push('units');
  if (discountIdx === -1) missingColumns.push('discount_pct');
  if (revenueIdx === -1) missingColumns.push('revenue');

  if (missingColumns.length > 0) {
    errors.push(`Missing required column(s): ${missingColumns.join(', ')}. Expected columns: quarter, region, channel, product, units, discount_pct, revenue.`);
    return {
      orders: [],
      errors,
      warnings,
      rawRowCount: rawRows.length - 1,
      validRowCount: 0,
    };
  }

  for (let r = 1; r < rawRows.length; r++) {
    const row = rawRows[r];
    // Skip empty trailing rows
    if (row.length === 1 && !row[0]) continue;

    const quarterRaw = row[quarterIdx] || '';
    const regionRaw = (row[regionIdx] || '').trim();
    const channelRaw = (row[channelIdx] || '').trim();
    const productRaw = (row[productIdx] || '').trim();
    const unitsRaw = row[unitsIdx] || '0';
    const discountRaw = row[discountIdx] || '0';
    const revenueRaw = row[revenueIdx] || '0';

    if (!quarterRaw || !regionRaw) {
      warnings.push(`Row ${r + 1}: Skipped due to missing quarter or region.`);
      continue;
    }

    const quarter = normalizeQuarter(quarterRaw);
    const region = normalizeCategoryName(regionRaw);
    const channel = normalizeCategoryName(channelRaw || 'Direct');
    const product = normalizeCategoryName(productRaw || 'General Product');
    const units = parseUnits(unitsRaw);
    const discount_pct = parseDiscount(discountRaw);
    const revenue = parseRevenue(revenueRaw);

    orders.push({
      id: `ord_${r}_${Date.now()}`,
      quarter,
      region,
      channel,
      product,
      units: Math.max(0, units),
      discount_pct: Math.max(0, discount_pct),
      revenue,
    });
  }

  return {
    orders,
    errors,
    warnings,
    rawRowCount: rawRows.length - 1,
    validRowCount: orders.length,
  };
}
