import React from "react";
import { Chip } from "@mui/material";
import { sampleType } from "../samples";

// Sample type color mapping
const sampleTypeColors = {
  bulk: "#4caf50",             // Green
  filter: "#ff9800",           // Orange  
  procedural_blank: "#9c27b0",  // Purple
  pure_water: "#2196f3",       // Blue (in case this type exists)
} as const;

interface SampleTypeChipProps {
  sampleType: string;
  size?: "small" | "medium";
  variant?: "filled" | "outlined";
}

export const SampleTypeChip: React.FC<SampleTypeChipProps> = ({
  sampleType: type,
  size = "small", 
  variant = "filled"
}) => {
  const displayName = sampleType[type] || type;
  const color = sampleTypeColors[type as keyof typeof sampleTypeColors] || "#9e9e9e";
  
  return (
    <Chip
      label={displayName}
      size={size}
      variant={variant}
      sx={{
        backgroundColor: variant === "filled" ? color : "transparent",
        color: variant === "filled" ? "white" : color,
        borderColor: variant === "outlined" ? color : undefined,
        fontWeight: 500,
      }}
    />
  );
};