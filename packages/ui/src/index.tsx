import * as React from "react";

export * from "./utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
}

export const Button = ({ children, className = "", ...props }: ButtonProps) => {
  return (
    <button
      className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
