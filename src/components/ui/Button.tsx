import { type ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "run" | "ghost" | "ink";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

const variantClass: Record<Variant, string> = {
  run: "run", // pine call-to-action (▶ Run class)
  ghost: "ghostbtn", // bordered subtle action (Clear)
  ink: "signin", // dark solid (save / sign-in)
};

/** Token-styled button, reusing the prototype's button classes. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "ghost", className, type = "button", ...rest }, ref) => {
    const cls = [variantClass[variant], className].filter(Boolean).join(" ");
    return <button ref={ref} type={type} className={cls} {...rest} />;
  },
);
Button.displayName = "Button";
