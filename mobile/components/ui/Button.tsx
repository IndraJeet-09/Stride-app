import React from "react";
import { TouchableOpacity, Text, TouchableOpacityProps, View } from "react-native";
import { cn } from "@/lib/utils";

export interface ButtonProps extends TouchableOpacityProps {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "ember";
  size?: "sm" | "md" | "lg" | "xl";
  label?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  label,
  icon,
  children,
  className,
  ...props
}: ButtonProps) {
  // Base styling for React Native button
  const baseClasses = "flex-row items-center justify-center rounded-lg font-medium active:opacity-85";

  const variantClasses = {
    primary: "bg-brand border border-brand-bright/30 shadow-sm",
    ember: "bg-brand-bright border border-brand/50",
    secondary: "bg-surface-card border border-border text-text-primary",
    outline: "border border-border bg-transparent",
    ghost: "bg-transparent",
    danger: "bg-red-950/80 border border-red-900",
  };

  const sizeClasses = {
    sm: "py-2 px-3 min-h-[36px]",
    md: "py-3 px-4 min-h-[44px]",
    lg: "py-3.5 px-6 min-h-[50px]",
    xl: "py-4 px-8 min-h-[56px] rounded-xl",
  };

  const textVariantClasses = {
    primary: "text-white font-bold tracking-tight",
    ember: "text-white font-bold tracking-tight",
    secondary: "text-text-primary font-semibold",
    outline: "text-text-secondary font-medium",
    ghost: "text-text-muted font-medium",
    danger: "text-red-400 font-semibold",
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
    xl: "text-lg font-bold",
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      className={cn(baseClasses, variantClasses[variant], sizeClasses[size], className)}
      {...props}
    >
      {icon && <View className="mr-2">{icon}</View>}
      {label ? (
        <Text className={cn(textVariantClasses[variant], textSizeClasses[size])}>
          {label}
        </Text>
      ) : (
        children
      )}
    </TouchableOpacity>
  );
}
