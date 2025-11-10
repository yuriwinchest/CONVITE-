export interface ParsedGuest {
  name: string;
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
        
        // Validar número de colunas
        if (parts.length > 2) {
          errors.push(`Linha ${i + 1}: Formato inválido - esperado máximo 2 colunas (nome${separator}mesa), encontrado ${parts.length}`);
          continue;
        }

        const [name, table] = parts;

        if (!name) {
          errors.push(`Linha ${i + 1}: Nome não pode estar vazio`);
          continue;
        }

        const guest: ParsedGuest = { name };

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
  const template = 'nome;mesa\nJoão Silva;1\nMaria Santos;2\nPedro Costa;1\nAna Lima;3\nCarlos Souza;\n\n--- OU com vírgula ---\n\nnome,mesa\nJoão Silva,1\nMaria Santos,2';
  const blob = new Blob([template], { type: 'text/csv;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'modelo_convidados.csv';
  a.click();
  window.URL.revokeObjectURL(url);
};
