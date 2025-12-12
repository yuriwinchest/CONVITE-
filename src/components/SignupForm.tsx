import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface SignupFormProps {
  onToggleForm: () => void;
}

const SignupForm = ({ onToggleForm }: SignupFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation('auth');

  const signupSchema = z.object({
    fullName: z.string().min(2, { message: t('validation.nameRequired') }),
    email: z.string().email({ message: t('validation.emailInvalid') }),
    password: z.string().min(6, { message: t('validation.passwordMin') }),
    confirmPassword: z.string(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: t('validation.passwordMismatch'),
    path: ["confirmPassword"],
  });

  type SignupFormData = z.infer<typeof signupSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/dashboard`;
      
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: data.fullName,
          },
        },
      });

      if (error) {
        toast({
          title: t('signup.title'),
          description: t('messages.signupError'),
          variant: "destructive",
        });
        return;
      }

      toast({
        title: t('messages.signupSuccess'),
        description: "",
      });
      
      navigate("/dashboard");
    } catch (error) {
      toast({
        title: t('signup.title'),
        description: t('messages.signupError'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="fullName">{t('signup.name')}</Label>
        <Input
          id="fullName"
          type="text"
          placeholder={t('signup.namePlaceholder')}
          {...register("fullName")}
          disabled={isLoading}
        />
        {errors.fullName && (
          <p className="text-sm text-destructive">{errors.fullName.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">{t('signup.email')}</Label>
        <Input
          id="email"
          type="email"
          placeholder={t('signup.emailPlaceholder')}
          {...register("email")}
          disabled={isLoading}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">{t('signup.password')}</Label>
        <Input
          id="password"
          type="password"
          placeholder={t('signup.passwordPlaceholder')}
          {...register("password")}
          disabled={isLoading}
        />
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">{t('signup.confirmPassword')}</Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder={t('signup.confirmPasswordPlaceholder')}
          {...register("confirmPassword")}
          disabled={isLoading}
        />
        {errors.confirmPassword && (
          <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full bg-primary hover:bg-accent text-primary-foreground"
        disabled={isLoading}
      >
        {isLoading ? t('signup.loading') : t('signup.submit')}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {t('signup.hasAccount')}{" "}
        <button
          type="button"
          onClick={onToggleForm}
          className="text-primary hover:underline font-semibold"
          disabled={isLoading}
        >
          {t('signup.login')}
        </button>
      </p>
    </form>
  );
};

export default SignupForm;
