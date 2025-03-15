const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="relative flex h-full min-h-screen w-full bg-[conic-gradient(at_top,_var(--tw-gradient-stops))] from-gray-100 via-gray-600 to-black">
      <div className="absolute inset-0 bg-[url(https://grainy-gradients.vercel.app/noise.svg)] opacity-25 brightness-100 contrast-150" />
      <div className="z-50 flex h-full min-h-screen w-full items-center justify-center">{children}</div>
    </div>
  );
};

export default AuthLayout;
