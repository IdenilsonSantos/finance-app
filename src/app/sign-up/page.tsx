import SignUpForm from "@/components/auth/SignUpForm";
import { Logo } from "@/components/Logo";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen bg-white">
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24 w-full lg:w-1/2">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="mb-10">
            <Logo variant="full" className="h-8" />
          </div>
          <SignUpForm />
        </div>
      </div>
      <div className="relative hidden w-0 flex-1 lg:block">
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
          <div className="relative w-full h-full bg-gradient-to-b from-gray-200 to-gray-100 flex items-center justify-center">
            <div className="absolute bottom-0 w-full h-1/2 bg-gradient-to-t from-[#EADFD8] to-transparent rounded-t-[100px] scale-150 translate-y-20 opacity-60"></div>
            <div className="relative z-10 flex flex-col items-center justify-center text-gray-400">
              <div className="w-48 h-48 rounded-full bg-[#dbf249] flex items-center justify-center mb-4 shadow-2xl"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
