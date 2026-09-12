import React from "react";
import { View, Text } from "react-native";
import Svg, { Path, Circle, Line } from "react-native-svg";
import { RoutePoint } from "@/lib/types";
import { Navigation } from "lucide-react-native";

interface RunRouteMapProps {
  points: RoutePoint[];
  title?: string;
  distanceKm?: number;
}

export function RunRouteMap({
  points,
  title = "GPS Track",
  distanceKm = 8.42,
}: RunRouteMapProps) {
  if (!points || points.length === 0) return null;

  const pathD = points.reduce((acc, pt, index) => {
    return index === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, "");

  const startPoint = points[0];
  const endPoint = points[points.length - 1];

  return (
    <View className="bg-surface-card border border-border rounded-2xl p-4 overflow-hidden">
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center space-x-2">
          <Navigation size={14} color="#C2410C" />
          <Text className="text-text-primary text-xs font-bold font-mono">
            {title}
          </Text>
        </View>
        <Text className="text-brand-bright text-xs font-mono font-bold">
          {distanceKm} KM
        </Text>
      </View>

      <View className="bg-background border border-border/40 rounded-xl h-64 items-center justify-center p-2">
        <Svg viewBox="0 0 300 200" className="w-full h-full">
          <Line x1="0" y1="100" x2="300" y2="100" stroke="#1D1D1D" strokeWidth="1" strokeDasharray="4 4" />
          <Line x1="150" y1="0" x2="150" y2="200" stroke="#1D1D1D" strokeWidth="1" strokeDasharray="4 4" />

          <Path
            d={pathD}
            fill="none"
            stroke="#9F2D14"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.3}
          />
          <Path
            d={pathD}
            fill="none"
            stroke="#C2410C"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {startPoint && (
            <Circle cx={startPoint.x} cy={startPoint.y} r="5" fill="#10B981" />
          )}

          {endPoint && (
            <Circle cx={endPoint.x} cy={endPoint.y} r="5" fill="#EF4444" />
          )}
        </Svg>
      </View>
    </View>
  );
}
