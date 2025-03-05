import { InfoCircledIcon } from "@radix-ui/react-icons";

import { CardWrapper } from "@/modules/auth/ui/components/form-wrapper";

const AuthErrorPage = () => {
  return (
    <CardWrapper
      headerLabel="¡Ups! Algo no ha salido bien..."
      backButtonHref="/auth/sing-in"
      backButtonLabel="Volver a intentarlo"
    >
      <div className="flex w-full items-center justify-center gap-x-4 rounded-lg border border-yellow-300 bg-yellow-100 px-4 py-2">
        <InfoCircledIcon className="h-12 w-12 text-yellow-500" />
        <p className="text-md text-yellow-500">
          No hemos podido iniciar sesión con las credenciales proporcionadas.
        </p>
      </div>
    </CardWrapper>
  );
};

export default AuthErrorPage;
