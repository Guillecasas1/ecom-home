"use client";

import Link from "next/link";
import { useTransition } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

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

import { login } from "../../actions/login";
import { CardWrapper } from "./form-wrapper";

const loginSchema = z.object({
  email: z.string().email({ message: "Introduce un email válido" }),
  password: z.string().min(4, { message: "Introduce una contraseña válida" }),
});

export const LoginForm = () => {
  const [isPending, startTransition] = useTransition();
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (values: z.infer<typeof loginSchema>) => {
    startTransition(() => {
      login(values).then(({ error }) => {
        if (error) {
          toast.error(error);
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
          <Button type="submit" className="w-full" disabled={isPending}>
            Iniciar sesión
          </Button>
        </form>
      </Form>
    </CardWrapper>
  );
};
