import SignInForm from "@/components/auth/SignInForm";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen bg-white">
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24 w-full lg:w-1/2">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <SignInForm />
        </div>
      </div>
      <div className="relative hidden w-0 flex-1 lg:block">
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
          <div className="relative w-full h-full bg-gray-500 flex items-center justify-center">
            <div className="absolute bottom-0 w-full h-1/2 bg-gradient-to-t from-[#EADFD8] to-transparent rounded-t-[100px] scale-150 translate-y-20 opacity-60" />
            <div className="relative z-10 flex flex-col items-center justify-center text-gray-400">
              <img
                src="https://res.cloudinary.com/djgvgwuwe/image/upload/v1788789010/logo_grande_rz2wy2.png"
                alt="Logo"
                className="w-96 h-96 object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
