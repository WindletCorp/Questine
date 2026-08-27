import { ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "framer-motion";

const glassButtonVariants = cva(
  "inline-flex items-center justify-center transition-colors cursor-pointer select-none",
  {
    variants: {
      variant: {
        profile:
          "w-[46px] h-[46px] rounded-full bg-white/5 border border-white/20 text-white/85 shadow-[0_12px_32px_rgba(0,0,0,0.45),inset_0_1px_1.5px_rgba(255,255,255,0.45),inset_0_-1px_1.5px_rgba(0,0,0,0.3)] hover:bg-white/15 hover:border-white/40 hover:text-white hover:shadow-[0_16px_40px_rgba(0,0,0,0.55),inset_0_1px_2px_rgba(255,255,255,0.65)]",
        pill:
          "rounded-full bg-white/10 border border-white/20 text-white/90 text-xs font-medium px-3.5 py-1.5 gap-1.5 shadow-[0_6px_16px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.3)] hover:bg-white/15 hover:border-white/35 hover:text-white",
        circle:
          "w-8 h-8 rounded-full bg-white/10 border border-white/20 text-white/80 hover:bg-white/20 hover:border-white/40 hover:text-white",
        step:
          "w-6 h-6 rounded-md bg-white/5 border border-white/20 text-white/85 text-[13px] leading-none hover:bg-white/20 hover:border-white/40 hover:text-white",
      },
    },
    defaultVariants: {
      variant: "pill",
    },
  }
);

interface GlassButtonProps
  extends Omit<HTMLMotionProps<"button">, "className">,
    VariantProps<typeof glassButtonVariants> {
  className?: string;
  children: ReactNode;
}

export function GlassButton({
  className,
  variant,
  children,
  ...props
}: GlassButtonProps) {
  // Common glass effects that are easier as inline styles due to arbitrary values
  const getGlassStyle = () => {
    switch (variant) {
      case "profile":
        return {
          backdropFilter: "blur(28px) saturate(190%)",
          WebkitBackdropFilter: "blur(28px) saturate(190%)",
        };
      case "pill":
        return {
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
        };
      case "circle":
        return {
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        };
      default: // step doesn't have explicit blur in original, but could use it
        return {};
    }
  };

  return (
    <motion.button
      className={cn(glassButtonVariants({ variant, className }))}
      style={{ ...getGlassStyle(), ...props.style }}
      whileHover={{ scale: variant === "step" ? 1 : variant === "pill" ? 1 : 1.05, y: variant === "pill" ? -1 : 0 }}
      whileTap={{ scale: variant === "profile" ? 0.94 : variant === "pill" ? 0.96 : variant === "circle" ? 0.92 : 0.9 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }} // Using springMicro from rules
      {...props}
    >
      {children}
    </motion.button>
  );
}
