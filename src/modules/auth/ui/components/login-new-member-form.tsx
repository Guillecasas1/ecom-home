"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { FormError } from "@/components/form-error";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import { loginNewMember } from "../../actions/login-new-member";
import { LoginValidator, type TLoginValidator } from "../../validations";
import { CardWrapper } from "./form-wrapper";

export const LoginNewMemberForm = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const organizationId = searchParams.get("organizationId");
  const token = searchParams.get("token");
  const urlError =
    searchParams.get("error") === "OAuthAccountNotLinkedError"
      ? "El email ya está registrado con otra cuenta"
      : undefined;

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>(undefined);
  const form = useForm<TLoginValidator>({
    resolver: zodResolver(LoginValidator),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (values: TLoginValidator) => {
    setError("");
    startTransition(() => {
      loginNewMember(organizationId, token, values).then((data) => {
        if (data?.error) {
          setError(data?.error);
        } else {
          router.push("/main");
        }
      });
    });
  };

  return (
    <CardWrapper
      headerLabel="Inicia sesión"
      backButtonLabel="¿No tienes una cuenta? Regístrate"
      backButtonHref="/auth/sign-up"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" disabled={isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" disabled={isPending} />
                  </FormControl>
                  <Button
                    variant="link"
                    size="sm"
                    className="px-0 font-normal"
                    asChild
                  >
                    <Link href="/auth/reset-password">
                      ¿Has olvidado tu contraseña?
                    </Link>
                  </Button>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          {error && <FormError message={error} />}
          {urlError && <FormError message={urlError} />}
          <Button type="submit" className="w-full" disabled={isPending}>
            Iniciar sesión
          </Button>
        </form>
      </Form>
    </CardWrapper>
  );
};
