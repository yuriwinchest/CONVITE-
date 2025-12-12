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

  // Para o header, usar logo transparente com fundo da cor primary via CSS
  if (variant === "header") {
    return (
      <div className={`bg-primary rounded-md p-1.5 ${className}`}>
        <img 
          src={logoLight} 
          alt="Encontre Meu Lugar" 
          className={`${sizeClasses[size]} w-auto object-contain`}
        />
      </div>
    );
  }

  const logoSrc = variant === "dark" ? logoDark : logoLight;

  return (
    <img 
      src={logoSrc} 
      alt="Encontre Meu Lugar" 
      className={`${sizeClasses[size]} w-auto object-contain rounded ${className}`}
    />
  );
};

export default Logo;
