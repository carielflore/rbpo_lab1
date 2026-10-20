import { useEffect, useState } from "react";
import { Box, TextField, MenuItem, Chip } from "@mui/material";
import api from "../api/axios";

export default function SearchBar({
  search,
  categories = [],
  onSearchChange,
  onCategoriesChange,
}) {
  const [availableCategories, setAvailableCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get("/categories/");
        setAvailableCategories(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.error("Ошибка загрузки категорий:", error);
        setAvailableCategories([]);
      }
    };

    fetchCategories();
  }, []);

  const handleCategoriesChange = (event) => {
    const value = event.target.value;
    const normalized = Array.isArray(value)
      ? value
      : typeof value === "string"
        ? value.split(",").filter(Boolean)
        : [];
    onCategoriesChange(normalized);
  };

  return (
    <Box sx={{ display: "flex", gap: 2, mb: 4, flexWrap: "wrap" }}>
      <TextField
        fullWidth
        label="Поиск по названию"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
      />

      <TextField
        select
        label="Категории"
        value={categories}
        onChange={handleCategoriesChange}
        SelectProps={{
          multiple: true,
          renderValue: (selected) => {
            const selectedValues = Array.isArray(selected)
              ? selected
              : typeof selected === "string"
                ? selected.split(",").filter(Boolean)
                : [];

            return (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                {selectedValues.map((slug) => {
                  const categoryObj = availableCategories.find(
                    (c) => c.slug === slug,
                  );
                  return (
                    <Chip
                      key={slug}
                      label={categoryObj ? categoryObj.name : slug}
                      size="small"
                    />
                  );
                })}
              </Box>
            );
          },
        }}
        sx={{ minWidth: 260 }}
      >
        {availableCategories.map((option) => (
          <MenuItem key={option.id} value={option.slug}>
            {option.name}
          </MenuItem>
        ))}
      </TextField>
    </Box>
  );
}
