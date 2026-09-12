import React from "react";
import { View, ViewProps } from "react-native";
import { cn } from "@/lib/utils";

export interface SeparatorProps extends ViewProps {
  orientation?: "horizontal" | "vertical";
}

export function Separator({
  orientation = "horizontal",
  className,
  ...props
}: SeparatorProps) {
  return (
    <View
      className={cn(
        "bg-border/80",
        orientation === "horizontal" ? "h-[1px] w-full" : "w-[1px] h-full",
        className
      )}
      {...props}
    />
  );
}
