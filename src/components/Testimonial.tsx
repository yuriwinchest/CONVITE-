import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const Testimonial = () => {
  return (
    <section className="py-20 px-6">
      <div className="container mx-auto max-w-3xl">
        <Card className="bg-primary text-primary-foreground border-0 shadow-xl">
          <CardContent className="p-12 text-center">
            <div className="flex justify-center gap-1 mb-6">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-current" />
              ))}
            </div>
            
            <blockquote className="text-xl italic mb-6 leading-relaxed">
              "Transformou completamente a recepção do nosso casamento. Os convidados ficaram
              encantados com a praticidade e elegância. Uma experiência verdadeiramente
              acolhedora!"
            </blockquote>
            
            <cite className="not-italic font-medium">
              — Marina & Pedro, Casamento em São Paulo
            </cite>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default Testimonial;
