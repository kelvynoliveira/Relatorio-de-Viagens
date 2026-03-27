export interface ParsedReceipt {
  totalAmount?: number;
  date?: string;
  liters?: number;
  pricePerLiter?: number;
  location?: string;
}

export function parseReceiptText(text: string): ParsedReceipt {
  const result: ParsedReceipt = {};
  const lines = text.split('\n');

  // Regex patterns for Portuguese receipts
  const dateRegex = /(\d{2})\/(\d{2})\/(\d{4}|\d{2})/;
  const timeRegex = /([012]\d):([0-5]\d)(?::([0-5]\d))?/;
  const currencyRegex = /(?:TOTAL(?:\s+R\$)?|VALOR(?:\s+A)?(?:\s+PAGAR)?|VALOR(?:\s+TOTAL))[\s:]*([\d.,]+)/i;
  const litersRegex = /(?:LITROS|QTDE|UNIT)[\s:]*([\d.,]+)/i;
  const priceRegex = /(?:PRECO|VALOR UNIT|UNITARIO)[\s:]*([\d.,]+)/i;
  const excludeKeywords = ['tributos', 'aproximado', 'lei', 'fed', 'icms', 'contribuinte'];

  // 1. Initial cleanup: filter lines to find location (usually top lines)
  const cleanLines = lines.map(l => l.trim()).filter(l => l.length > 2);
  if (cleanLines.length > 0) {
    // Usually the first 1-3 lines contain the business name
    const potentialLocation = cleanLines.slice(0, 3).find(l => 
        l.length > 5 && !l.includes('/') && !l.includes(':') && !/\d{5,}/.test(l)
    );
    if (potentialLocation) result.location = potentialLocation;
  }

  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    
    // Skip lines with excluded keywords to avoid picking up tax values (like R$ 1.52)
    if (excludeKeywords.some(kw => lowerLine.includes(kw))) continue;

    // 1. Date & Time Detection
    if (!result.date) {
      const dateMatch = line.match(dateRegex);
      if (dateMatch) {
        let year = dateMatch[3];
        if (year.length === 2) year = `20${year}`;
        
        let time = "12:00:00";
        const timeMatch = line.match(timeRegex);
        if (timeMatch) {
            time = `${timeMatch[1]}:${timeMatch[2]}:${timeMatch[3] || '00'}`;
        }
        
        result.date = `${year}-${dateMatch[2]}-${dateMatch[1]}T${time}.000Z`;
      }
    }

    // 2. Currency/Total Detection (Explicit Keywords)
    if (!result.totalAmount) {
      const totalMatch = line.match(currencyRegex);
      if (totalMatch) {
        const value = parseNumber(totalMatch[1]);
        if (value > 0.1) result.totalAmount = value; // Avoid tiny values
      }
    }

    // 3. Liters Detection (Fuel specific)
    if (!result.liters) {
      const litersMatch = line.match(litersRegex);
      if (litersMatch) {
        const value = parseNumber(litersMatch[1]);
        if (value > 0) result.liters = value;
      }
    }

    // 4. Price per Liter Detection
    if (!result.pricePerLiter) {
      const priceMatch = line.match(priceRegex);
      if (priceMatch) {
        const value = parseNumber(priceMatch[1]);
        if (value > 0) result.pricePerLiter = value;
      }
    }
  }

  // Backup: if no total found by keyword, look for the largest number in the text (often the total)
  if (!result.totalAmount) {
    const allNumbers = text.match(/[\d]{1,3}(?:\.[\d]{3})*(?:,[\d]{2})/g) || [];
    const values = allNumbers.map(n => parseNumber(n));
    if (values.length > 0) {
      result.totalAmount = Math.max(...values);
    }
  }

  return result;
}

function parseNumber(str: string): number {
  // Handles 1.234,56 -> 1234.56
  const clean = str.replace(/[^\d,.]/g, '').replace(/\./g, '').replace(',', '.');
  return parseFloat(clean) || 0;
}
