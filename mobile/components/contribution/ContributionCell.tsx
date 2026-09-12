import React from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import { DayContribution } from "@/lib/types";
import { triggerHaptic } from "@/lib/haptics";

interface ContributionCellProps {
  day: DayContribution;
  size?: number;
  isSelected?: boolean;
  onPress: (day: DayContribution) => void;
}

const INTENSITY_COLORS: Record<number, string> = {
  0: "#1C1C20", // distinct dark gray for empty cells
  1: "#832E12", // rich warm ember
  2: "#A33814", // medium burnt orange
  3: "#C2410C", // signature brand orange
  4: "#EA580C", // vibrant high-intensity orange
};

export const ContributionCell = React.memo(function ContributionCell({
  day,
  size = 13,
  isSelected = false,
  onPress,
}: ContributionCellProps) {
  const bg = INTENSITY_COLORS[day.level] ?? INTENSITY_COLORS[0];

  const handlePress = () => {
    triggerHaptic("selection");
    onPress(day);
  };

  return (
    <TouchableOpacity
      activeOpacity={0.65}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`${day.date}: ${day.distance.toFixed(1)} km, ${day.count || day.runsCount} runs`}
      style={[
        styles.cell,
        {
          width: size,
          height: size,
          backgroundColor: bg,
        },
        isSelected && styles.selected,
      ]}
    />
  );
});

const styles = StyleSheet.create({
  cell: {
    borderRadius: 3,
    margin: 2.2, // Clean visual gap in the grid
  },
  selected: {
    borderWidth: 2,
    borderColor: "#FFFFFF",
    transform: [{ scale: 1.15 }],
    zIndex: 10,
  },
});
