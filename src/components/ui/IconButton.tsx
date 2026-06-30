import { type ButtonHTMLAttributes, forwardRef } from "react";

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Required accessible name — icon buttons have no text content. */
  label: string;
};

/**
 * Small icon control (reorder, remove, duration ±). Caller supplies the
 * className for the prototype style (e.g. "del", "row-tools" child) and the
 * glyph as children; `label` becomes the accessible name + tooltip.
 */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ label, className, type = "button", children, ...rest }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={className}
        aria-label={label}
        title={label}
        {...rest}
      >
        {children}
      </button>
    );
  },
);
IconButton.displayName = "IconButton";
