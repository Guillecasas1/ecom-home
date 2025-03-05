// "use client";

// import { useSearchParams } from "next/navigation";
// import { useState, useTransition } from "react";

// import { zodResolver } from "@hookform/resolvers/zod";
// import { useForm } from "react-hook-form";

// import { FormError } from "@/components/form-error";
// import { FormSuccess } from "@/components/form-success";
// import { Button } from "@/components/ui/button";
// import {
//   Form,
//   FormControl,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormMessage,
// } from "@/components/ui/form";
// import { Input } from "@/components/ui/input";

// import { newPassword } from "../../actions/new-password";
// import {
//   NewPasswordValidator,
//   type TNewPasswordValidator,
// } from "../../validations";
// import { CardWrapper } from "./form-wrapper";

// export const NewPasswordForm = () => {
//   const searchParams = useSearchParams();
//   const token = searchParams.get("token");

//   const [isPending, startTransition] = useTransition();
//   const [error, setError] = useState<string | undefined>(undefined);
//   const [success, setSuccess] = useState<string | undefined>(undefined);
//   const form = useForm<TNewPasswordValidator>({
//     resolver: zodResolver(NewPasswordValidator),
//     defaultValues: {
//       password: "",
//     },
//   });

//   const onSubmit = (values: TNewPasswordValidator) => {
//     setError("");
//     startTransition(() => {
//       newPassword(values, token).then((data) => {
//         // setError(data?.error)
//         setSuccess(data?.success);
//       });
//     });
//   };

//   return (
//     <CardWrapper
//       headerLabel="Introduce una contraseña nueva"
//       backButtonLabel="Vovler al inico"
//       backButtonHref="/auth/login"
//     >
//       <Form {...form}>
//         <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
//           <div className="space-y-4">
//             <FormField
//               control={form.control}
//               name="password"
//               render={({ field }) => (
//                 <FormItem>
//                   <FormLabel>Nueva contraseña</FormLabel>
//                   <FormControl>
//                     <Input {...field} type="password" disabled={isPending} />
//                   </FormControl>
//                   <FormMessage />
//                 </FormItem>
//               )}
//             />
//           </div>
//           {error && <FormError message={error} />}
//           {success && <FormSuccess message={success} />}
//           <Button type="submit" className="w-full" disabled={isPending}>
//             Restablecer contraseña
//           </Button>
//         </form>
//       </Form>
//     </CardWrapper>
//   );
// };
