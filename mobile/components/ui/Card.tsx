import React from "react";
import { View, ViewProps } from "react-native";
import { cn } from "@/lib/utils";

export interface CardProps extends ViewProps {
  variant?: "default" | "subtle" | "bordered" | "ember";
  children?: React.ReactNode;
}

export function Card({
  variant = "default",
  className,
  children,
  ...props
}: CardProps) {
  const baseClasses = "rounded-xl p-4";

  const variantClasses = {
    default: "bg-surface-card border border-border",
    subtle: "bg-surface border border-border/60",
    bordered: "bg-transparent border border-border",
    ember: "bg-brand-subtle/30 border border-brand/40",
  };

  return (
    <View
      className={cn(baseClasses, variantClasses[variant], className)}
      {...props}
    >
      {children}
    </View>
  );
}
