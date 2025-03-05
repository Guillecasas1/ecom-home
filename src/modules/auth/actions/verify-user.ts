"use server";

import { cookies } from "next/headers";

export const verifyUser = async (token: string) => {
  const cookieStore = cookies();

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SERVER_URL}/auth/verify-token`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
    }
  );

  const status = res.status;
  const data = await res.json();

  if (status === 200) {
    const { token, ...user } = data;
    cookieStore.set("user", JSON.stringify(user));
    cookieStore.set("USER_TOKEN", token);
    return { success: "Email verificado, redirigiendo..." };
  }

  return { error: "Ha ocurrido un error" };
};
// 'use server'

// import { db } from '@/lib/db';
// import { getUserByEmail } from '../services/user';
// import { login } from './login';

// export const verifyUser = async (token: string) => {
//   // Comprueba si existe el token
//   // Comprueba si el token ha expirado
//   // Actualiza el usuario a verificado
//   // Elimina el token de verificación
//   // Loguea al usuario (JWT)
//   const verificationToken = await getVerificationTokenByToken(token);
//   if (!verificationToken) return { error: "El token introducido no existe" }

//   const hasExpired = new Date() > verificationToken.expires;
//   if (hasExpired) {
//     return { error: "El token ha expirado" }
//   }

//   const user = await getUserByEmail(verificationToken.email);
//   if (!user) return { error: "Usuario no encontrado" }

//   await db.user.update({
//     where: {
//       id: user.id
//     },
//     data: {
//       emailVerified: new Date(),
//       email: verificationToken.email
//     }
//   });

//   await db.verificationToken.delete({
//     where: {
//       id: verificationToken.id
//     }
//   });

//   await login({ email: user.email as string, password: user.password as string })

//   return { success: "Email verificado" }
// }
