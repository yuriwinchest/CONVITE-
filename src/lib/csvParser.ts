export interface ParsedGuest {
  name: string;
  email?: string;
  whatsapp?: string;
  table_number?: number;
}

export interface CSVParseResult {
  guests: ParsedGuest[];
  errors: string[];
}

const validateTableNumber = (table: string): number | null => {
  const num = parseInt(table);
  return !isNaN(num) && num > 0 ? num : null;
};

const detectSeparator = (text: string): string => {
  const firstLine = text.split('\n')[0] || '';
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  return semicolonCount > commaCount ? ';' : ',';
};

const cleanValue = (value: string): string => {
  return value
    .replace(/^["'\s]+|["'\s]+$/g, '') // Remove aspas e espaços das pontas
    .trim();
};

const validateWhatsApp = (phone: string): string | null => {
  // Remove todos os caracteres não numéricos
  const cleaned = phone.replace(/\D/g, '');
  
  // Verifica se é um número brasileiro válido (11 dígitos: DDD + 9 dígitos)
  if (cleaned.length === 11 && cleaned.startsWith('55')) {
    return `+${cleaned}`;
  }
  if (cleaned.length === 11) {
    return `+55${cleaned}`;
  }
  if (cleaned.length === 13 && cleaned.startsWith('55')) {
    return `+${cleaned}`;
  }
  
  // Se já tem + no início, mantém
  if (phone.startsWith('+') && cleaned.length >= 10) {
    return phone;
  }
  
  return null;
};

export const parseCSV = async (file: File): Promise<CSVParseResult> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      let text = e.target?.result as string;
      
      // Remove BOM (Byte Order Mark) se presente
      text = text.replace(/^\uFEFF/, '');
      
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length === 0) {
        resolve({
          guests: [],
          errors: ['Arquivo CSV vazio']
        });
        return;
      }

      // Detectar separador automaticamente
      const separator = detectSeparator(text);
      
      const guests: ParsedGuest[] = [];
      const errors: string[] = [];

      // Skip header if it looks like a header
      const firstLine = lines[0]?.toLowerCase() || '';
      const hasHeader = firstLine.includes('nome') || 
                       firstLine.includes('name') || 
                       firstLine.includes('mesa') || 
                       firstLine.includes('table');
      
      const startIndex = hasHeader ? 1 : 0;

      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const parts = line.split(separator).map(cleanValue);
        
        // Validar número de colunas (nome, email, whatsapp, mesa)
        if (parts.length > 4) {
          errors.push(`Linha ${i + 1}: Formato inválido - esperado máximo 4 colunas (nome${separator}email${separator}whatsapp${separator}mesa), encontrado ${parts.length}`);
          continue;
        }

        const [name, email, whatsapp, table] = parts;

        if (!name) {
          errors.push(`Linha ${i + 1}: Nome não pode estar vazio`);
          continue;
        }

        const guest: ParsedGuest = { name };

        if (email && email.includes('@')) {
          guest.email = email;
        }

        if (whatsapp) {
          const validatedWhatsApp = validateWhatsApp(whatsapp);
          if (validatedWhatsApp) {
            guest.whatsapp = validatedWhatsApp;
          } else {
            errors.push(`Linha ${i + 1}: WhatsApp inválido "${whatsapp}" - use formato brasileiro com DDD`);
          }
        }

        if (table) {
          const tableNumber = validateTableNumber(table);
          if (tableNumber) {
            guest.table_number = tableNumber;
          } else {
            errors.push(`Linha ${i + 1}: Número da mesa inválido "${table}"`);
          }
        }

        guests.push(guest);
      }

      if (guests.length === 0 && errors.length === 0) {
        errors.push('Arquivo CSV vazio ou formato inválido');
      }

      resolve({ guests, errors });
    };

    reader.onerror = () => {
      resolve({
        guests: [],
        errors: ['Erro ao ler arquivo']
      });
    };

    reader.readAsText(file, 'UTF-8');
  });
};

export const downloadCSVTemplate = () => {
  const template = 'nome;email;whatsapp;mesa\nJoão Silva;joao@email.com;11999999999;1\nMaria Santos;maria@email.com;11988888888;2\nPedro Costa;pedro@email.com;11977777777;1\nAna Lima;;11966666666;3\nCarlos Souza;carlos@email.com;;\n\n--- OU com vírgula ---\n\nnome,email,whatsapp,mesa\nJoão Silva,joao@email.com,11999999999,1\nMaria Santos,maria@email.com,11988888888,2';
  const blob = new Blob([template], { type: 'text/csv;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'modelo_convidados.csv';
  a.click();
  window.URL.revokeObjectURL(url);
};
