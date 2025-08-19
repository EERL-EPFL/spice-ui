import React from "react";
import { Chip, Box } from "@mui/material";
import { treatmentName } from "../treatments";

// Treatment color mapping
const treatmentColors = {
  none: "#9e9e9e",       // Grey
  heat: "#ff5722",       // Deep Orange  
  h2o2: "#2196f3",       // Blue
} as const;

interface TreatmentChipsProps {
  treatments?: Array<{ name: string; [key: string]: any }>;
  size?: "small" | "medium";
  variant?: "filled" | "outlined";
}

export const TreatmentChips: React.FC<TreatmentChipsProps> = ({ 
  treatments, 
  size = "small",
  variant = "filled"
}) => {
  if (!treatments || treatments.length === 0) {
    return (
      <Chip 
        label="No treatments" 
        size={size}
        variant="outlined"
        sx={{ backgroundColor: "#f5f5f5", color: "#666" }}
      />
    );
  }

  return (
    <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
      {treatments.map((treatment, index) => {
        const displayName = treatmentName[treatment.name] || treatment.name;
        const color = treatmentColors[treatment.name as keyof typeof treatmentColors] || "#9e9e9e";
        
        return (
          <Chip
            key={index}
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
      })}
    </Box>
  );
};

interface SingleTreatmentChipProps {
  treatmentName: string;
  size?: "small" | "medium";
  variant?: "filled" | "outlined";
}

export const SingleTreatmentChip: React.FC<SingleTreatmentChipProps> = ({
  treatmentName: name,
  size = "small", 
  variant = "filled"
}) => {
  const displayName = treatmentName[name] || name;
  const color = treatmentColors[name as keyof typeof treatmentColors] || "#9e9e9e";
  
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