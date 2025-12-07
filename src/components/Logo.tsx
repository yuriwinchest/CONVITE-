import { MapPin } from "lucide-react";

interface LogoProps {
  className?: string;
  iconSize?: number;
}

const Logo = ({ className = "", iconSize = 24 }: LogoProps) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <MapPin className="text-accent" style={{ width: iconSize, height: iconSize }} />
      <div className="flex flex-col leading-tight">
        <span className="font-display text-xs md:text-sm font-semibold tracking-wide text-primary-foreground">
          ENCONTRE
        </span>
        <span className="font-display text-xs md:text-sm font-semibold tracking-wide text-primary-foreground">
          MEU LUGAR
        </span>
      </div>
    </div>
  );
};

export default Logo;
