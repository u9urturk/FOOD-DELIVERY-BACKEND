import UAParser from 'ua-parser-js';

export interface ParsedUA {
  browser?: string;
  os?: string;
  device?: string;
}

export function parseUserAgent(ua: string): ParsedUA {
  if (!ua) return {};
  try {
    const parser = new (UAParser as any)(ua);
    const b = parser.getBrowser?.() || {};
    const o = parser.getOS?.() || {};
    const d = parser.getDevice?.() || {};
    const browser = (b.name as string) || undefined;
    const os = (o.name as string) || undefined;
    let device: string | undefined;
    if (d && (d.type || d.vendor || d.model)) {
      device = [d.vendor, d.model, d.type].filter(Boolean).join(' ').trim() || undefined;
    }
    if (!device) device = d.type ? d.type : 'Desktop';
    return { browser, os, device };
  } catch {
    return {};
  }
}
