import { useEffect, useState } from "react";
import { Grid, Typography, Box, Button } from "@mui/material";
import { Link } from "react-router-dom";
import api from "../api/axios";
import RecipeCard from "../components/RecipeCard";

export default function MyRecipesPage() {
  const [recipes, setRecipes] = useState([]);

  useEffect(() => {
    fetchMyRecipes();
  }, []);

  const fetchMyRecipes = async () => {
    try {
      const response = await api.get("/my-recipes/");
      setRecipes(response.data);
    } catch (error) {
      console.error("Ошибка загрузки моих рецептов:", error);
    }
  };

  return (
    <>
      <Typography variant="h4" gutterBottom>
        Мои рецепты
      </Typography>

      <Grid container spacing={3}>
        {recipes.map((recipe) => (
          <Grid item xs={12} sm={6} md={4} key={recipe.id}>
            <RecipeCard recipe={recipe} />
            <Box sx={{ mt: 1, display: "flex", justifyContent: "flex-end" }}>
              <Button
                component={Link}
                to={`/recipes/${recipe.id}/edit`}
                size="small"
                variant="outlined"
              >
                Редактировать
              </Button>
            </Box>
          </Grid>
        ))}
      </Grid>
    </>
  );
}
