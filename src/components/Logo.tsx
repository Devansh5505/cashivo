import iconUrl from "/cashivo-icon.png";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: number;
  className?: string;
  showWordmark?: boolean;
}

export function Logo({ size = 32, className, showWordmark = true }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <img src={iconUrl} alt="Cashivo" width={size} height={size} className="drop-shadow-sm" />
      {showWordmark && (
        <span className="font-display font-bold text-xl tracking-tight text-foreground">
          Cashivo
        </span>
      )}
    </div>
  );
}
