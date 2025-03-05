// "use client";

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

// import { resetPassword } from "../../actions/reset-password";

// import { CardWrapper } from "./form-wrapper";



// export const ResetForm = () => {
//   const [isPending, startTransition] = useTransition();
//   const [error, setError] = useState<string | undefined>(undefined);
//   const [success, setSuccess] = useState<string | undefined>(undefined);
//   const form = useForm<TResetPasswordValidator>({
//     resolver: zodResolver(ResetPasswordValidator),
//     defaultValues: {
//       email: "",
//     },
//   });

//   const onSubmit = (values: TResetPasswordValidator) => {
//     setError("");
//     startTransition(() => {
//       resetPassword(values).then((data) => {
//         setError(data?.error);
//         setSuccess(data?.success);
//       });
//     });
//   };

//   return (
//     <CardWrapper
//       headerLabel="Recupera tu contraseña"
//       backButtonLabel="Vovler al inico"
//       backButtonHref="/auth/login"
//     >
//       <Form {...form}>
//         <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
//           <div className="space-y-4">
//             <FormField
//               control={form.control}
//               name="email"
//               render={({ field }) => (
//                 <FormItem>
//                   <FormLabel>Email</FormLabel>
//                   <FormControl>
//                     <Input {...field} type="email" disabled={isPending} />
//                   </FormControl>
//                   <FormMessage />
//                 </FormItem>
//               )}
//             />
//           </div>
//           {error && <FormError message={error} />}
//           {success && <FormSuccess message={success} />}
//           <Button type="submit" className="w-full" disabled={isPending}>
//             Recuperar contraseña
//           </Button>
//         </form>
//       </Form>
//     </CardWrapper>
//   );
// };
