export interface ParsedGuest {
  name: string;
  email?: string;
}

export interface CSVParseResult {
  guests: ParsedGuest[];
  errors: string[];
}

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const parseCSV = async (file: File): Promise<CSVParseResult> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      
      const guests: ParsedGuest[] = [];
      const errors: string[] = [];

      // Skip header if it looks like a header
      const startIndex = lines[0]?.toLowerCase().includes('nome') || lines[0]?.toLowerCase().includes('name') ? 1 : 0;

      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const [name, email] = line.split(',').map(item => item.trim());

        if (!name) {
          errors.push(`Linha ${i + 1}: Nome não pode estar vazio`);
          continue;
        }

        const guest: ParsedGuest = { name };

        if (email) {
          if (validateEmail(email)) {
            guest.email = email;
          } else {
            errors.push(`Linha ${i + 1}: Email inválido "${email}"`);
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

    reader.readAsText(file);
  });
};

export const downloadCSVTemplate = () => {
  const template = 'nome,email\nJoão Silva,joao@exemplo.com\nMaria Santos,maria@exemplo.com';
  const blob = new Blob([template], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'modelo_convidados.csv';
  a.click();
  window.URL.revokeObjectURL(url);
};
