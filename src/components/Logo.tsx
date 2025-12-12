import logoHeader from "@/assets/logo-encontre-meu-lugar-full.jpg";
import logoDark from "@/assets/logo-dark.png";
import logoLight from "@/assets/logo-no-bg.png";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "light" | "dark" | "header";
}

const Logo = ({ className = "", size = "md", variant = "light" }: LogoProps) => {
  const sizeClasses = {
    sm: "h-8",
    md: "h-10",
    lg: "h-16",
  };

  const logoSrc = variant === "header" 
    ? logoHeader 
    : variant === "dark" 
      ? logoDark 
      : logoLight;

  return (
    <img 
      src={logoSrc} 
      alt="Encontre Meu Lugar" 
      className={`${sizeClasses[size]} w-auto object-contain rounded ${className}`}
    />
  );
};

export default Logo;
