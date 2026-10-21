/**
 * Central input sanitation utility for Excel/CSV data.
 * Neutralizes CSV formula injection and strips unwanted tags without catastrophic backtracking (ReDoS).
 */

export function sanitizeCell(value: any): string {
  if (value === null || value === undefined) return '';
  let str = String(value).trim();

  // Strip script & HTML tags linearly without catastrophic regex backtracking
  str = str.replace(/<[^>]*>/g, '');

  // Neutralize CSV formula injection (=, +, -, @, tab, newline at the start)
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  return str;
}

export function cleanDni(value: any): string {
  if (value === null || value === undefined) return '';
  const str = String(value).trim();
  // Remove prefix letters like "DNI", "D.N.I.", "LC", "CI", dots, commas, spaces, dashes
  const digits = str.replace(/^(?:dni|d\.n\.i\.|lc|ci|cuil|cuit)\s*[:.\-]?\s*/i, '').replace(/[^0-9]/g, '');
  const clean = digits || str.replace(/[^a-zA-Z0-9._-]/g, '').toLowerCase();
  return sanitizeCell(clean);
}

export function cleanEmail(value: any): string {
  if (value === null || value === undefined) return '';
  const clean = String(value).trim().toLowerCase();
  return sanitizeCell(clean);
}

export function validateEmail(email: string): boolean {
  if (!email) return false;
  // RFC-compliant simple check without ReDoS vulnerability
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(email);
}

export function toTitleCase(value: string): string {
  if (!value) return '';
  const lowercaseWords = new Set(['de', 'del', 'la', 'las', 'los', 'y', 'e', 'o', 'u', 'da', 'do', 'dos', 'das', 'van', 'von']);
  
  const cleaned = sanitizeCell(value);
  return cleaned
    .toLowerCase()
    .split(/\s+/)
    .map((word, index) => {
      if (word.length === 0) return '';
      if (index > 0 && lowercaseWords.has(word)) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

export function splitFullName(fullName: string): { firstname: string; lastname: string } {
  if (!fullName) return { firstname: '', lastname: '' };
  const clean = sanitizeCell(fullName);
  
  // Format: "APELLIDO, NOMBRE" or "APELLIDO, NOMBRE SEGUNDO"
  if (clean.includes(',')) {
    const parts = clean.split(',').map(p => p.trim()).filter(Boolean);
    const lastname = parts[0] || '';
    const firstname = parts.slice(1).join(' ') || '';
    return { firstname, lastname };
  }

  // Format without comma: "NOMBRE APELLIDO" or "APELLIDO NOMBRE"
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return { firstname: parts[0], lastname: '' };
  }
  if (parts.length === 2) {
    return { firstname: parts[0], lastname: parts[1] };
  }
  if (parts.length === 3) {
    return { firstname: `${parts[0]} ${parts[1]}`, lastname: parts[2] };
  }
  const mid = Math.floor(parts.length / 2);
  return {
    firstname: parts.slice(0, mid).join(' '),
    lastname: parts.slice(mid).join(' ')
  };
}
