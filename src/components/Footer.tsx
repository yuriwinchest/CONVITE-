import { useTranslation } from "react-i18next";

const Footer = () => {
  const { t } = useTranslation('common');

  return (
    <footer className="bg-primary text-primary-foreground py-8 px-6">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm">
            {t('footer.brand')}
          </div>
          <div className="text-sm text-primary-foreground/80">
            {t('footer.copyright')}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
