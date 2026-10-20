import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Typography,
  Paper,
  Box,
  List,
  ListItem,
  ListItemText,
  Divider,
  Button,
} from "@mui/material";
import api from "../api/axios";

export default function RecipeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const getImageUrl = (path) => {
    if (!path) return null;
    return path.startsWith("http") ? path : `http://127.0.0.1:8000${path}`;
  };

  useEffect(() => {
    fetchRecipe();
    fetchProfile();
  }, [id]);

  const fetchRecipe = async () => {
    try {
      const response = await api.get(`/recipes/${id}/`);
      setRecipe(response.data);
    } catch (error) {
      console.error("Ошибка загрузки рецепта:", error);
    }
  };

  const fetchProfile = async () => {
    try {
      const response = await api.get("/users/profile/");
      setCurrentUser(response.data);
    } catch (error) {
      setCurrentUser(null);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm("Удалить этот рецепт?");
    if (!confirmed) return;

    try {
      await api.get("/users/csrf/");
    } catch (error) {
      // ignore
    }

    try {
      await api.delete(`/recipes/${id}/`);
      navigate("/my-recipes");
    } catch (error) {
      console.error("Ошибка удаления рецепта:", error);
      alert("Не удалось удалить рецепт");
    }
  };

  if (!recipe) {
    return <Typography>Загрузка...</Typography>;
  }

  const isAuthor =
    currentUser &&
    recipe.author &&
    Number(currentUser.id) === Number(recipe.author);

  return (
    <Paper sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        {recipe.title}
      </Typography>

      {recipe.image && (
        <Box
          component="img"
          src={getImageUrl(recipe.image)}
          alt={recipe.title}
          sx={{ width: "100%", maxHeight: 400, objectFit: "cover", mb: 2 }}
        />
      )}

      <Typography variant="subtitle1" gutterBottom>
        Категории:{" "}
        {Array.isArray(recipe.categories) && recipe.categories.length
          ? recipe.categories.map((c) => c.name).join(", ")
          : "—"}
      </Typography>

      <Typography variant="subtitle2" gutterBottom>
        Автор: {recipe.author_username}
      </Typography>

      {isAuthor && (
        <Box sx={{ display: "flex", gap: 2, mb: 2, mt: 1 }}>
          <Button
            variant="outlined"
            component={Link}
            to={`/recipes/${id}/edit`}
          >
            Редактировать
          </Button>
          <Button variant="contained" color="error" onClick={handleDelete}>
            Удалить
          </Button>
        </Box>
      )}

      <Typography variant="body1" sx={{ mt: 2, mb: 3 }}>
        {recipe.description}
      </Typography>

      <Divider sx={{ my: 2 }} />

      <Typography variant="h6" gutterBottom>
        Ингредиенты
      </Typography>

      <List>
        {recipe.ingredients.map((item, index) => (
          <ListItem key={index} disablePadding>
            <ListItemText
              primary={`${item.ingredient_name} — ${item.amount} ${item.unit}`}
            />
          </ListItem>
        ))}
      </List>

      <Divider sx={{ my: 2 }} />

      <Typography variant="h6" gutterBottom>
        Шаги приготовления
      </Typography>

      <Typography variant="body1">{recipe.steps}</Typography>
    </Paper>
  );
}
