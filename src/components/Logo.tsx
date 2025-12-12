import logoLight from "@/assets/logo-transparent.png";
import logoDark from "@/assets/logo-dark.png";

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

  // Para o header, usamos o logo claro com fundo da cor primary
  if (variant === "header") {
    return (
      <div className={`bg-primary rounded-md p-1 ${className}`}>
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
      className={`${sizeClasses[size]} w-auto object-contain ${className}`}
    />
  );
};

export default Logo;
