import * as React from "react";
import { Box, InputAdornment } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { FilterLiveForm, TextInput } from "react-admin";

export const ExperimentFilterForm = () => (
  <FilterLiveForm>
    <Box sx={{ display: "flex", alignItems: "flex-end", mb: 1 }}>
      <Box component="span" sx={{ mr: 2 }}>
        <TextInput
          resettable
          helperText={false}
          source="q"
          label="Search"
          InputProps={{
              endAdornment: (
                  <InputAdornment position="end">
                      <SearchIcon color="disabled" />
                  </InputAdornment>
              )
          }}
        />
      </Box>
    </Box>
  </FilterLiveForm>
);
