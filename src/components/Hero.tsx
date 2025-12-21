import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ContactForm from "@/components/ContactForm";
import {
  Search,
  QrCode,
  Users,
  Clock,
  Heart,
  Sparkles,
  Star,
  Mail,
  Instagram
} from "lucide-react";

const Hero = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(['home', 'common']);
  const [contactOpen, setContactOpen] = useState(false);

  // Brand colors using design system tokens
  const brandGreen = 'hsl(143 38% 15%)';
  const brandCream = 'hsl(38 32% 87%)';

  // Animation variants
  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: "easeOut" }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const scaleIn = {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.5, ease: "easeOut" }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section - Baunilha */}
      <section className="py-12 md:py-20 px-4 sm:px-6" style={{ backgroundColor: brandCream }}>
        <motion.div
          className="container mx-auto max-w-4xl text-center"
          initial="initial"
          animate="animate"
          variants={staggerContainer}
        >
          <motion.div
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full mb-4 sm:mb-6"
            style={{ backgroundColor: 'rgba(46, 94, 63, 0.1)', color: brandGreen }}
            variants={scaleIn}
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-xs sm:text-sm font-medium">{t('home:hero.badge')}</span>
          </motion.div>

          <motion.h1
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 leading-tight px-2"
            style={{ color: brandGreen }}
            variants={fadeInUp}
          >
            {t('home:hero.title')}
          </motion.h1>

          <motion.p
            className="text-base sm:text-lg mb-8 sm:mb-10 max-w-3xl mx-auto leading-relaxed px-2"
            style={{ color: brandGreen, opacity: 0.8 }}
            variants={fadeInUp}
          >
            {t('home:hero.description')}
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-4"
            variants={fadeInUp}
          >
            <Button
              size="lg"
              onClick={() => navigate("/auth")}
              style={{ backgroundColor: brandGreen, color: brandCream }}
              className="hover:opacity-90 px-6 sm:px-8 py-5 sm:py-6 text-sm sm:text-base font-semibold w-full sm:w-auto"
            >
              {t('common:buttons.createEvent')}
            </Button>
            <Button
              size="lg"
              variant="outline"
              style={{ borderColor: brandGreen, color: brandGreen, borderWidth: '2px' }}
              className="px-6 sm:px-8 py-5 sm:py-6 text-sm sm:text-base font-semibold hover:opacity-80 w-full sm:w-auto"
              onClick={() => navigate("/confirm")}
            >
              <Search className="w-4 sm:w-5 h-4 sm:h-5 mr-2" />
              {t('common:buttons.findMyPlace')}
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* Como Funciona - Verde */}
      <section className="py-12 md:py-20 px-4 sm:px-6" style={{ backgroundColor: brandGreen }}>
        <div className="container mx-auto max-w-6xl">
          <motion.div
            className="text-center mb-10 md:mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4" style={{ color: brandCream }}>
              {t('home:howItWorks.title')}
            </h2>
            <p className="text-base sm:text-lg md:text-xl" style={{ color: brandCream, opacity: 0.85 }}>
              {t('home:howItWorks.subtitle')}
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp}>
              <Card className="hover:shadow-xl transition-all duration-300 h-full" style={{ backgroundColor: brandCream, borderColor: 'rgba(232, 224, 210, 0.2)' }}>
                <CardHeader>
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: 'rgba(46, 94, 63, 0.1)' }}>
                    <Clock className="w-8 h-8" style={{ color: brandGreen }} />
                  </div>
                  <CardTitle className="text-2xl" style={{ color: brandGreen }}>{t('home:howItWorks.step1.title')}</CardTitle>
                  <CardDescription className="text-base" style={{ color: brandGreen, opacity: 0.75 }}>
                    {t('home:howItWorks.step1.description')}
                  </CardDescription>
                </CardHeader>
              </Card>
            </motion.div>

            <motion.div variants={fadeInUp}>
              <Card className="hover:shadow-xl transition-all duration-300 h-full" style={{ backgroundColor: brandCream, borderColor: 'rgba(232, 224, 210, 0.2)' }}>
                <CardHeader>
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: 'rgba(46, 94, 63, 0.1)' }}>
                    <QrCode className="w-8 h-8" style={{ color: brandGreen }} />
                  </div>
                  <CardTitle className="text-2xl" style={{ color: brandGreen }}>{t('home:howItWorks.step2.title')}</CardTitle>
                  <CardDescription className="text-base" style={{ color: brandGreen, opacity: 0.75 }}>
                    {t('home:howItWorks.step2.description')}
                  </CardDescription>
                </CardHeader>
              </Card>
            </motion.div>

            <motion.div variants={fadeInUp}>
              <Card className="hover:shadow-xl transition-all duration-300 h-full" style={{ backgroundColor: brandCream, borderColor: 'rgba(232, 224, 210, 0.2)' }}>
                <CardHeader>
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: 'rgba(46, 94, 63, 0.1)' }}>
                    <Users className="w-8 h-8" style={{ color: brandGreen }} />
                  </div>
                  <CardTitle className="text-2xl" style={{ color: brandGreen }}>{t('home:howItWorks.step3.title')}</CardTitle>
                  <CardDescription className="text-base" style={{ color: brandGreen, opacity: 0.75 }}>
                    {t('home:howItWorks.step3.description')}
                  </CardDescription>
                </CardHeader>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Para Quem - Baunilha */}
      <section className="py-12 md:py-20 px-4 sm:px-6" style={{ backgroundColor: brandCream }}>
        <div className="container mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
          >
            <Card className="shadow-2xl" style={{ backgroundColor: brandGreen, borderColor: 'rgba(232, 224, 210, 0.2)' }}>
              <CardContent className="p-6 sm:p-8 md:p-12">
                <div className="flex items-center gap-3 mb-4 sm:mb-6">
                  <Heart className="w-8 sm:w-10 h-8 sm:h-10 flex-shrink-0" style={{ color: brandCream }} />
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold" style={{ color: brandCream }}>
                    {t('home:forWhom.title')}
                  </h2>
                </div>
                <p className="text-base sm:text-lg leading-relaxed pl-11 sm:pl-[52px]" style={{ color: brandCream, opacity: 0.9 }}>
                  {t('home:forWhom.description')}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Portfólio / Casos de Uso - Verde */}
      <section className="py-12 md:py-20 px-4 sm:px-6" style={{ backgroundColor: brandGreen }}>
        <div className="container mx-auto max-w-6xl">
          <motion.div
            className="text-center mb-10 md:mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 px-2" style={{ color: brandCream }}>
              {t('home:portfolio.title')}
            </h2>
            <p className="text-base sm:text-lg md:text-xl max-w-3xl mx-auto px-2" style={{ color: brandCream, opacity: 0.85 }}>
              {t('home:portfolio.subtitle')}
            </p>
          </motion.div>

          {/* Testimonials */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-8 md:mb-12"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp}>
              <Card className="h-full hover:shadow-xl transition-shadow duration-300" style={{ backgroundColor: brandCream, borderColor: 'rgba(232, 224, 210, 0.2)' }}>
                <CardContent className="p-8">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5" style={{ fill: brandGreen, color: brandGreen }} />
                    ))}
                  </div>
                  <p className="italic mb-4 leading-relaxed" style={{ color: brandGreen, opacity: 0.75 }}>
                    "{t('home:portfolio.testimonial1.text')}"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(46, 94, 63, 0.1)' }}>
                      <Users className="w-6 h-6" style={{ color: brandGreen }} />
                    </div>
                    <div>
                      <p className="font-semibold" style={{ color: brandGreen }}>{t('home:portfolio.testimonial1.author')}</p>
                      <p className="text-sm" style={{ color: brandGreen, opacity: 0.6 }}>{t('home:portfolio.testimonial1.event')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={fadeInUp}>
              <Card className="h-full hover:shadow-xl transition-shadow duration-300" style={{ backgroundColor: brandCream, borderColor: 'rgba(232, 224, 210, 0.2)' }}>
                <CardContent className="p-8">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5" style={{ fill: brandGreen, color: brandGreen }} />
                    ))}
                  </div>
                  <p className="italic mb-4 leading-relaxed" style={{ color: brandGreen, opacity: 0.75 }}>
                    "{t('home:portfolio.testimonial2.text')}"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(46, 94, 63, 0.1)' }}>
                      <Sparkles className="w-6 h-6" style={{ color: brandGreen }} />
                    </div>
                    <div>
                      <p className="font-semibold" style={{ color: brandGreen }}>{t('home:portfolio.testimonial2.author')}</p>
                      <p className="text-sm" style={{ color: brandGreen, opacity: 0.6 }}>{t('home:portfolio.testimonial2.event')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Planos e Preços - Baunilha */}
      <section className="py-12 md:py-20 px-4 sm:px-6" style={{ backgroundColor: brandCream }}>
        <div className="container mx-auto max-w-5xl">
          <motion.div
            className="text-center mb-10 md:mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 px-2" style={{ color: brandGreen }}>
              {t('home:pricing.title')}
            </h2>
            <p className="text-base sm:text-lg md:text-xl max-w-3xl mx-auto px-2" style={{ color: brandGreen, opacity: 0.8 }}>
              {t('home:pricing.subtitle')}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <Card className="shadow-2xl" style={{ backgroundColor: brandGreen, borderColor: 'rgba(232, 224, 210, 0.2)' }}>
              <CardContent className="p-6 sm:p-8 md:p-12 text-center">
                <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4" style={{ color: brandCream }}>
                  {t('home:pricing.contact.title')}
                </h3>
                <p className="text-base sm:text-lg mb-6 sm:mb-8" style={{ color: brandCream, opacity: 0.9 }}>
                  {t('home:pricing.contact.description')}
                </p>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                  <Button
                    size="lg"
                    className="gap-2 hover:opacity-90"
                    style={{ backgroundColor: brandCream, color: brandGreen }}
                    onClick={() => setContactOpen(true)}
                  >
                    <Mail className="w-5 h-5" />
                    suporte@encontremeulugar.com.br
                  </Button>
                  <Button
                    size="lg"
                    className="gap-2 hover:opacity-90"
                    style={{ backgroundColor: brandCream, color: brandGreen }}
                    onClick={() => window.open("https://instagram.com/encontremeulugar", "_blank")}
                  >
                    <Instagram className="w-5 h-5" />
                    @encontremeulugar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      <ContactForm open={contactOpen} onOpenChange={setContactOpen} />

      {/* CTA Final - Verde */}
      <motion.section
        className="py-12 md:py-20 px-4 sm:px-6"
        style={{ backgroundColor: brandGreen }}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <div className="container mx-auto max-w-4xl text-center">
          <motion.h2
            className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 px-2"
            style={{ color: brandCream }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {t('home:cta.title')}
          </motion.h2>
          <motion.p
            className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8 px-2"
            style={{ color: brandCream, opacity: 0.9 }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            {t('home:cta.description')}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Button
              size="lg"
              style={{ backgroundColor: brandCream, color: brandGreen }}
              className="hover:opacity-90 px-8 py-6 text-base font-semibold"
              onClick={() => navigate("/auth")}
            >
              {t('common:buttons.createEvent')}
            </Button>
          </motion.div>
        </div>
      </motion.section>
    </div>
  );
};

export default Hero;