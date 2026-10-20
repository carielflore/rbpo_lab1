import { useEffect, useState } from "react";
import { Grid, Typography, Box } from "@mui/material";
import api from "../api/axios";
import RecipeCard from "../components/RecipeCard";
import SearchBar from "../components/SearchBar";

export default function HomePage() {
  const [recipes, setRecipes] = useState([]);
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchRecipes();
  }, [search, categories]);

  const fetchRecipes = async () => {
    try {
      const response = await api.get("/recipes/", {
        params: {
          search: search || undefined,
          categories: categories.length ? categories : undefined,
        },
        paramsSerializer: {
          indexes: null,
        },
      });
      setRecipes(response.data);
    } catch (error) {
      console.error("Ошибка загрузки рецептов:", error);
    }
  };

  return (
    <>
      <Typography variant="h4" gutterBottom>
        Рецепты
      </Typography>

      <SearchBar
        search={search}
        categories={categories}
        onSearchChange={setSearch}
        onCategoriesChange={setCategories}
      />

      <Grid container spacing={3} alignItems="stretch">
        {recipes.map((recipe) => (
          <Grid
            item
            xs={12}
            sm={6}
            md={4}
            key={recipe.id}
            sx={{ display: "flex" }}
          >
            <Box
              sx={{
                width: "100%",
                display: "flex",
                "& .MuiCard-root": {
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                },
                "& .MuiCardMedia-root": {
                  height: 220,
                  minHeight: 220,
                  maxHeight: 220,
                  width: "100%",
                  overflow: "hidden",
                  objectFit: "cover",
                },
                "& .MuiCardContent-root": {
                  flexGrow: 1,
                },
              }}
            >
              <RecipeCard recipe={recipe} />
            </Box>
          </Grid>
        ))}
      </Grid>
    </>
  );
}
