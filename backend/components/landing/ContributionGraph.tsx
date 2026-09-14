"use client";

import { motion } from "framer-motion";
import { useState, useMemo } from "react";

interface ContributionDay {
  dateKey: string;
  date: Date;
  weekday: number;
  weekIndex: number;
  monthIndex: number;
  isInYear: boolean;
  runCount: number;
  distanceKm: number;
  intensity: number;
}

interface MonthLabel {
  month: string;
  weekIndex: number;
}

export default function ContributionGraph() {
  const [hoveredCell, setHoveredCell] = useState<ContributionDay | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isGraphHovered, setIsGraphHovered] = useState(false);

  const YEAR = 2026;

  const { calendarData, monthLabels, weekCount } = useMemo(() => {
    const jan1 = new Date(YEAR, 0, 1);
    const jan1Weekday = jan1.getDay();
    const firstSunday = new Date(YEAR, 0, 1 - jan1Weekday);

    const dec31 = new Date(YEAR, 11, 31);
    const dec31Weekday = dec31.getDay();
    const lastSaturday = new Date(YEAR, 11, 31 + (6 - dec31Weekday));

    const totalDays = Math.ceil((lastSaturday.getTime() - firstSunday.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const weeks = Math.ceil(totalDays / 7);

    const seededRandom = (seed: number) => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };

    const allDays: ContributionDay[] = [];
    const monthLabelsMap = new Map<number, MonthLabel>();

    for (let weekIdx = 0; weekIdx < weeks; weekIdx++) {
      for (let weekday = 0; weekday < 7; weekday++) {
        const dayOffset = weekIdx * 7 + weekday;
        const currentDate = new Date(firstSunday);
        currentDate.setDate(firstSunday.getDate() + dayOffset);

        const dateKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
        const isInYear = currentDate.getFullYear() === YEAR;
        const monthIndex = currentDate.getMonth();

        if (isInYear && !monthLabelsMap.has(monthIndex)) {
          const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
          monthLabelsMap.set(monthIndex, {
            month: monthNames[monthIndex],
            weekIndex: weekIdx,
          });
        }

        let runCount = 0;
        let distanceKm = 0;
        let intensity = 0;

        if (isInYear) {
          const seed = currentDate.getTime();
          const isWeekend = weekday === 0 || weekday === 6;
          const isMonday = weekday === 1;
          const runProbability = isWeekend ? 0.75 : isMonday ? 0.3 : 0.55;
          const random1 = seededRandom(seed);
          const random2 = seededRandom(seed + 1);

          if (random1 < runProbability) {
            runCount = random2 < 0.1 ? 2 : 1;
            distanceKm = isWeekend
              ? seededRandom(seed + 2) * 12 + 5
              : seededRandom(seed + 2) * 8 + 3;

            if (distanceKm < 5) intensity = 1;
            else if (distanceKm < 8) intensity = 2;
            else if (distanceKm < 12) intensity = 3;
            else if (distanceKm < 15) intensity = 4;
            else intensity = 5;
          }
        }

        allDays.push({
          dateKey,
          date: currentDate,
          weekday,
          weekIndex: weekIdx,
          monthIndex,
          isInYear,
          runCount,
          distanceKm,
          intensity,
        });
      }
    }

    return {
      calendarData: allDays,
      monthLabels: Array.from(monthLabelsMap.values()).sort((a, b) => a.weekIndex - b.weekIndex),
      weekCount: weeks,
    };
  }, [YEAR]);

  const weekColumns = useMemo(() => {
    const columns: ContributionDay[][] = [];
    for (let w = 0; w < weekCount; w++) {
      columns.push(calendarData.filter(day => day.weekIndex === w));
    }
    return columns;
  }, [calendarData, weekCount]);

  const getIntensityColor = (intensity: number, isHovered = false): string => {
    if (isHovered) {
      // Brighter colors when graph is hovered
      switch (intensity) {
        case 0: return "#1F1F2E";
        case 1: return "#3B2A5A";
        case 2: return "#5B3A8A";
        case 3: return "#7C4ABF";
        case 4: return "#9D5FED";
        case 5: return "#C4A5FF";
        default: return "#1F1F2E";
      }
    }
    // Normal colors
    switch (intensity) {
      case 0: return "#171720";
      case 1: return "#24183A";
      case 2: return "#3B1F63";
      case 3: return "#5B2A91";
      case 4: return "#7C3AED";
      case 5: return "#A78BFA";
      default: return "#171720";
    }
  };

  const handleMouseMove = (e: React.MouseEvent, cell: ContributionDay) => {
    if (cell.isInYear && cell.runCount > 0) {
      setHoveredCell(cell);
      setMousePosition({ x: e.clientX, y: e.clientY });
    }
  };

  // Calculate proximity intensity for organic ripple effect
  const getProximityIntensity = (cell: ContributionDay): number => {
    if (!hoveredCell || !cell.isInYear || cell.runCount === 0) return 0;
    if (cell.dateKey === hoveredCell.dateKey) return 1; // Center cell = max intensity

    const weekDistance = Math.abs(cell.weekIndex - hoveredCell.weekIndex);
    const dayDistance = Math.abs(cell.weekday - hoveredCell.weekday);

    // Euclidean distance in grid space
    const distance = Math.sqrt(weekDistance * weekDistance + dayDistance * dayDistance);

    // Only affect cells within radius of ~2.5
    if (distance > 2.5) return 0;

    // Smooth falloff: 1 at center, fading to 0 at radius
    // Using smoothstep for organic feel
    const normalized = distance / 2.5;
    const falloff = 1 - normalized * normalized * (3 - 2 * normalized); // Smoothstep

    // Add subtle organic variation based on cell position (deterministic)
    const cellSeed = cell.date.getTime() * 0.0001;
    const variation = Math.sin(cellSeed) * 0.15 + 0.85; // 0.7 to 1.0

    return falloff * variation;
  };

  // Check if a cell is nearby the hovered cell
  const isNearbyCell = (cell: ContributionDay): boolean => {
    return getProximityIntensity(cell) > 0 && cell.dateKey !== hoveredCell?.dateKey;
  };

  // Get color with hover effect applied
  const getCellColor = (cell: ContributionDay): string => {
    if (!cell.isInYear) return "#0F0F16";

    const baseColor = getIntensityColor(cell.intensity, isGraphHovered);
    const proximityIntensity = getProximityIntensity(cell);

    if (proximityIntensity === 0) return baseColor;

    // Brighten the color based on proximity
    // Parse the hex color and increase brightness
    const hex = baseColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Boost factor increases with proximity (20% to 60% boost)
    const boostFactor = 1 + (proximityIntensity * 0.6);

    const newR = Math.min(255, Math.floor(r * boostFactor));
    const newG = Math.min(255, Math.floor(g * boostFactor));
    const newB = Math.min(255, Math.floor(b * boostFactor));

    return `rgb(${newR}, ${newG}, ${newB})`;
  };

  return (
    <div className="relative w-full max-w-[min(94vw,1600px)] mx-auto" id="contribution-graph">
      {/* Year label */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="mb-8"
      >
        <span className="text-xl font-mono text-muted font-semibold">{YEAR}</span>
      </motion.div>

      {/* Graph container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.2 }}
        onMouseEnter={() => setIsGraphHovered(true)}
        onMouseLeave={() => {
          setIsGraphHovered(false);
          setHoveredCell(null);
        }}
        className="relative border border-border rounded-2xl p-8 lg:p-10 bg-surface/50 backdrop-blur-sm overflow-x-auto"
      >
        {/* Month labels positioned by calendar */}
        <div className="relative mb-6 ml-[60px]" style={{ height: '20px' }}>
          {monthLabels.map((label, idx) => (
            <motion.div
              key={label.month}
              initial={{ opacity: 0, y: -10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.4 + idx * 0.03 }}
              className="absolute text-sm text-muted font-mono font-medium"
              style={{
                left: `${(label.weekIndex / weekCount) * 100}%`,
              }}
            >
              {label.month}
            </motion.div>
          ))}
        </div>

        {/* Grid layout */}
        <div className="flex gap-3">
          {/* Weekday labels */}
          <div className="flex flex-col justify-between py-1" style={{ width: '50px' }}>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, idx) => (
              <div
                key={day}
                className="text-[13px] text-muted font-mono font-medium flex items-center h-[16px]"
                style={{ opacity: idx % 2 === 1 ? 1 : 0 }}
              >
                {idx % 2 === 1 ? day : ""}
              </div>
            ))}
          </div>

          {/* Contribution grid - full width */}
          <div className="flex-1 grid gap-[5px]" style={{
            gridTemplateColumns: `repeat(${weekCount}, minmax(0, 1fr))`,
            gridAutoFlow: 'column'
          }}>
            {weekColumns.map((week, weekIdx) => (
              <div key={weekIdx} className="flex flex-col gap-[5px]">
                {week.map((cell) => {
                  const isNearby = isNearbyCell(cell);
                  const isHovered = hoveredCell?.dateKey === cell.dateKey;

                  return (
                    <motion.div
                      key={cell.dateKey}
                      initial={{ opacity: 0, scale: 0 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      animate={{
                        scale: isHovered ? 1.35 : isNearby ? 1.15 : isGraphHovered ? 1.05 : 1,
                        opacity: cell.isInYear ? (isNearby ? 0.85 : 1) : 0.3,
                      }}
                      transition={{
                        duration: isGraphHovered ? 0.4 : 0.3,
                        delay: isGraphHovered ? weekIdx * 0.008 + cell.weekday * 0.01 : 0.6 + weekIdx * 0.01 + cell.weekday * 0.005,
                        type: "spring",
                        stiffness: isHovered || isNearby ? 300 : 200,
                        damping: isHovered || isNearby ? 25 : 20,
                      }}
                      className="aspect-square rounded-sm relative min-h-[14px]"
                      style={{
                        backgroundColor: getCellColor(cell),
                        zIndex: isHovered ? 10 : isNearby ? 5 : 1,
                      }}
                      onMouseEnter={(e) => handleMouseMove(e, cell)}
                      onMouseMove={(e) => handleMouseMove(e, cell)}
                      onMouseLeave={() => setHoveredCell(null)}
                      data-cursor-pointer={cell.isInYear && cell.runCount > 0}
                    >
                      {/* Glow effect on hover */}
                      {isHovered && cell.runCount > 0 && (
                        <motion.div
                          className="absolute inset-0 rounded-sm pointer-events-none"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.15 }}
                          style={{
                            boxShadow: `0 0 24px 4px ${getIntensityColor(cell.intensity)}`,
                          }}
                        />
                      )}

                      {/* Subtle glow on nearby cells */}
                      {isNearby && cell.runCount > 0 && (
                        <motion.div
                          className="absolute inset-0 rounded-sm pointer-events-none"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 0.4 }}
                          transition={{ duration: 0.2 }}
                          style={{
                            boxShadow: `0 0 12px 2px ${getIntensityColor(cell.intensity)}`,
                          }}
                        />
                      )}
                    </motion.div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 1.2 }}
          className="flex items-center justify-end gap-3 mt-10 text-sm text-muted font-mono"
        >
          <span>Less</span>
          <div className="flex gap-[5px]">
            {[0, 1, 2, 3, 4, 5].map((intensity) => (
              <motion.div
                key={intensity}
                className="w-[14px] h-[14px] rounded-sm"
                animate={{
                  backgroundColor: getIntensityColor(intensity, isGraphHovered)
                }}
                transition={{ duration: 0.3 }}
              />
            ))}
          </div>
          <span>More</span>
        </motion.div>
      </motion.div>

      {/* Tooltip */}
      {hoveredCell && hoveredCell.runCount > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.15 }}
          className="fixed z-[100] px-4 py-3 bg-surface-elevated border border-border rounded-lg shadow-2xl pointer-events-none backdrop-blur-xl"
          style={{
            left: Math.min(mousePosition.x + 16, window.innerWidth - 200),
            top: mousePosition.y + 16,
          }}
        >
          <div className="text-sm text-foreground font-medium mb-1">
            {hoveredCell.date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </div>
          <div className="text-xs text-muted space-y-0.5">
            <div>
              {hoveredCell.runCount} run{hoveredCell.runCount > 1 ? "s" : ""}
            </div>
            <div className="font-mono">{hoveredCell.distanceKm.toFixed(1)} km</div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
