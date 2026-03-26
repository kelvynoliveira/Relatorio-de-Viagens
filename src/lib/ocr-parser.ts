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
  const dateRegex = /(\d{2})\/(\d{2})\/(\d{2,4})/;
  const currencyRegex = /(?:R\$|Total|VALOR|PAGAR|TOTAL|VALOR TOTAL)[\s:]*([\d.,]+)/i;
  const litersRegex = /(?:LITROS|QTDE|UNIT)[\s:]*([\d.,]+)/i;
  const priceRegex = /(?:PRECO|VALOR UNIT|UNITARIO)[\s:]*([\d.,]+)/i;

  for (const line of lines) {
    // 1. Date Detection
    if (!result.date) {
      const dateMatch = line.match(dateRegex);
      if (dateMatch) {
        let year = dateMatch[3];
        if (year.length === 2) year = `20${year}`;
        result.date = `${year}-${dateMatch[2]}-${dateMatch[1]}T12:00:00.000Z`;
      }
    }

    // 2. Currency/Total Detection
    // Simple logic: look for lines containing "TOTAL" or "PAGAR" and a number
    if (!result.totalAmount) {
      const totalMatch = line.match(currencyRegex);
      if (totalMatch) {
        const value = parseNumber(totalMatch[1]);
        if (value > 0) result.totalAmount = value;
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
