import React from "react";
import { View, Text, ViewProps } from "react-native";
import { cn } from "@/lib/utils";

export interface BadgeProps extends ViewProps {
  variant?: "default" | "secondary" | "streak" | "outline" | "ember";
  label: string;
  icon?: React.ReactNode;
}

export function Badge({
  variant = "default",
  label,
  icon,
  className,
  ...props
}: BadgeProps) {
  const baseClasses = "flex-row items-center px-2.5 py-1 rounded-full border self-start";

  const variantClasses = {
    default: "bg-surface-hover border-border text-text-primary",
    secondary: "bg-surface border border-border/80 text-text-secondary",
    outline: "bg-transparent border border-border text-text-secondary",
    streak: "bg-brand-subtle/60 border border-brand/50 text-brand-bright",
    ember: "bg-brand border border-brand-bright/40 text-white font-bold",
  };

  const textClasses = {
    default: "text-text-primary text-xs font-semibold",
    secondary: "text-text-secondary text-xs font-medium",
    outline: "text-text-secondary text-xs font-medium",
    streak: "text-brand-bright text-xs font-mono font-bold tracking-tight",
    ember: "text-white text-xs font-bold",
  };

  return (
    <View className={cn(baseClasses, variantClasses[variant], className)} {...props}>
      {icon && <View className="mr-1">{icon}</View>}
      <Text className={textClasses[variant]}>{label}</Text>
    </View>
  );
}
