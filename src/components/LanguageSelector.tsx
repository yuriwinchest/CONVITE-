import { useTranslation } from 'react-i18next';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

const LanguageSelector = () => {
  const { i18n, t } = useTranslation('common');

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const currentLanguage = i18n.language;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className="text-primary-foreground hover:bg-primary-foreground/10 gap-2"
        >
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">
            {currentLanguage === 'pt' ? '🇧🇷 PT' : '🇪🇸 ES'}
          </span>
          <span className="sm:hidden">
            {currentLanguage === 'pt' ? '🇧🇷' : '🇪🇸'}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-background border border-border z-50">
        <DropdownMenuItem 
          onClick={() => changeLanguage('pt')}
          className={currentLanguage === 'pt' ? 'bg-accent' : ''}
        >
          🇧🇷 {t('languages.portuguese')}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => changeLanguage('es')}
          className={currentLanguage === 'es' ? 'bg-accent' : ''}
        >
          🇪🇸 {t('languages.spanish')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSelector;
