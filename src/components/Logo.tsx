import logoLight from "@/assets/logo-transparent.png";
import logoDark from "@/assets/logo-dark.png";
import logoWithBg from "@/assets/logo-with-bg.png";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "light" | "dark" | "with-bg";
}

const Logo = ({ className = "", size = "md", variant = "light" }: LogoProps) => {
  const sizeClasses = {
    sm: "h-8",
    md: "h-10",
    lg: "h-16",
  };

  const logoSrc = variant === "dark" 
    ? logoDark 
    : variant === "with-bg" 
      ? logoWithBg 
      : logoLight;

  return (
    <img 
      src={logoSrc} 
      alt="Encontre Meu Lugar" 
      className={`${sizeClasses[size]} w-auto object-contain ${className}`}
    />
  );
};

export default Logo;
