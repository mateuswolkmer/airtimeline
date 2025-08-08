import React from "react";
import { twMerge } from "tailwind-merge";

export const Button = ({
  children,
  className,
  variant = "filled",
  onlyIcon = false,
  size = "base",
  ...props
}) => {
  return (
    <button
      className={twMerge(
        "border border-foreground rounded-xl cursor-pointer transition-colors",
        size === "base" && "px-4 py-2",
        size === "sm" && "px-2 py-1 text-sm",
        variant === "filled" && "bg-foreground text-white",
        variant === "outline" && "",
        onlyIcon && "rounded-full p-2",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};
