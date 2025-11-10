import { useState } from "react";
import LoginForm from "@/components/LoginForm";
import SignupForm from "@/components/SignupForm";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-background rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center text-foreground mb-8">
          {isLogin ? "Fazer Login" : "Criar Conta"}
        </h1>
        
        {isLogin ? (
          <LoginForm onToggleForm={() => setIsLogin(false)} />
        ) : (
          <SignupForm onToggleForm={() => setIsLogin(true)} />
        )}
      </div>
    </div>
  );
};

export default Auth;
