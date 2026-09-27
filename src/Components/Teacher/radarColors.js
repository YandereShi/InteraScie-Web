export const allRadarColor = "#00BF63";

const sectionColors = [
  "#3B82F6",
  "#EF4444",
  "#EAB308",
  "#F97316",
  "#EC4899",
  "#8B5CF6",
  "#06B6D4",
  "#93C5FD",
  "#FDA4AF",
  "#C4B5FD",
  "#FDBA74",
  "#FDE047",
  "#67E8F9",
];

export function SectionRadarColor(index) {
  if (index < sectionColors.length) return sectionColors[index];

  const hue = ((index - sectionColors.length) * 137.508 + 26) % 360;
  const saturation = 0.7;
  const lightness = 0.65;
  const spread = saturation * Math.min(lightness, 1 - lightness);
  const channel = (offset) => {
    const position = (offset + hue / 30) % 12;
    const value = lightness - spread * Math.max(-1, Math.min(position - 3, 9 - position, 1));
    return Math.round(value * 255).toString(16).padStart(2, "0");
  };
  return `#${channel(0)}${channel(8)}${channel(4)}`.toUpperCase();
}
