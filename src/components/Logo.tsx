import { cn } from "@/lib/utils";

const LOGO_FULL_URL =
  "https://res.cloudinary.com/djgvgwuwe/image/upload/v1788789010/logo_grande_rz2wy2.png";
const LOGO_MINI_URL =
  "https://res.cloudinary.com/djgvgwuwe/image/upload/v1788789010/logo_mini_zttgmf.png";

interface LogoProps {
  /** "full" is the wordmark logo, "mini" is the compact square mark for minified/collapsed UI. */
  variant?: "full" | "mini";
  className?: string;
}

export function Logo({ variant = "full", className }: LogoProps) {
  return (
    <img
      src={variant === "mini" ? LOGO_MINI_URL : LOGO_FULL_URL}
      alt="Logo"
      className={cn(
        "object-contain shrink-0",
        variant === "mini" ? "w-10 h-10" : "h-10 w-auto",
        className,
      )}
    />
  );
}
