"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { LoaderIcon } from "lucide-react";

import { FormError } from "@/components/form-error";
import { FormSuccess } from "@/components/form-success";

import { verifyUser } from "../../actions/verify-user";
import { CardWrapper } from "./form-wrapper";

export const VerifyForm = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [error, setError] = useState<string | undefined>(undefined);
  const [success, setSuccess] = useState<string | undefined>(undefined);

  const onSubmit = useCallback(async () => {
    if (!token) {
      setError("Token inválido");
      return;
    }

    await verifyUser(token).then(({ success, error }) => {
      if (success) {
        setSuccess(success);
        router.push("/onboarding");
      } else {
        setError(error);
      }
    });
  }, [token]);

  useEffect(() => {
    onSubmit();
  }, [onSubmit]);

  return (
    <CardWrapper
      headerLabel="Estamos confirmando tu cuenta"
      backButtonLabel="Volver a inicio de sesión"
      backButtonHref="/auth/login"
    >
      <div className="flex flex-col space-y-4">
        {!error && !success && (
          <>
            <LoaderIcon className="h-12 w-12 animate-spin" />
            <p>Estamos verificando tu cuenta...</p>
          </>
        )}
        {error && <FormError message={error} />}
        {success && <FormSuccess message={success} />}
      </div>
    </CardWrapper>
  );
};
