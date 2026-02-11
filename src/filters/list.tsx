import * as React from "react";
import { TextInput, SelectInput } from "react-admin";

export const postFilters = [
  <TextInput key="search" label="Search" source="q" alwaysOn />,
  <SelectInput
    key="type"
    source="type"
    label="Sample Type"
    choices={[
      { id: "bulk", name: "Bulk" },
      { id: "filter", name: "Filter" },
      { id: "blank", name: "Blank" },
      { id: "filter_blank", name: "Filter Blank" },
    ]}
    alwaysOn
  />,
];
