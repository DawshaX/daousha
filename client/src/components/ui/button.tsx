import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>({
  defaultProps: {
    variant: "default",
    size: "default",
  },
  props,
  {
    render(_, { className, ...rest }) {
      const variant = props.variant;
      const size = props.size;

      const mapVariants: Record<
        string,
        { bg?: string; fg?: string; hoverBg?: string; border?: string }
      > = {
        default: {
          bg: "violet-600",
          fg: "white",
          hoverBg: "violet-500",
          border: "violet-600",
        },
        destructive: {
          bg: "red-600",
          fg: "white",
          hoverBg: "red-500",
          border: "red-600",
        },
        outline: {
          bg: "transparent",
          fg: "violet-600",
          hoverBg: "violet-500/10",
          border: "violet-600",
        },
        secondary: {
          bg: "violet-500",
          fg: "white",
          hoverBg: "violet-400",
          border: "violet-500",
        },
        ghost: {
          bg: "transparent",
          fg: "violet-600",
          hoverBg: "violet-500/10",
          border: "none",
        },
        link: {
          bg: "transparent",
          fg: "violet-600",
          hoverBg: "violet-500/10",
          border: "none",
        },
      };

      const variantStyles = mapVariants[variant] || mapVariants.default;

      const finalClassName = cn(
        "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
        variantStyles.bg
          ? `bg-${variantStyles.bg} hover:bg-${variantStyles.hoverBg} border border-${variantStyles.border} text-${variantStyles.fg}`
          : `text-violet-600 hover:underline`,
        size &&
          size !== "default" &&
          `w-${size === "sm" ? "80" : size === "lg" ? "120" : "100"} h-[${size === "sm" ? "32" : size === "lg" ? "40" : "44"}]`,
        className
      );

      return (
        <button className={finalClassName} {...rest} />
      );
    },
  }
});

Button.displayName = "Button";