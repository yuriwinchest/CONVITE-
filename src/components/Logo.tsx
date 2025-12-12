import { MapPin } from "lucide-react";

interface LogoProps {
  className?: string;
  iconSize?: number;
}

const Logo = ({ className = "", iconSize = 24 }: LogoProps) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <MapPin className="text-logo-text" style={{ width: iconSize, height: iconSize }} />
      <div className="flex flex-col leading-tight">
        <span className="font-serif text-xs md:text-sm font-medium tracking-widest text-logo-text uppercase italic">
          ENCONTRE
        </span>
        <span className="font-serif text-xs md:text-sm font-medium tracking-widest text-logo-text uppercase italic">
          MEU LUGAR
        </span>
      </div>
    </div>
  );
};

export default Logo;
