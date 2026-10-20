import {
  Card,
  CardContent,
  CardActions,
  CardMedia,
  Typography,
  Button,
  Box,
} from "@mui/material";
import { Link } from "react-router-dom";

export default function RecipeCard({ recipe }) {
  const imageUrl =
    recipe.image && recipe.image.length
      ? recipe.image.startsWith("http")
        ? recipe.image
        : `http://127.0.0.1:8000${recipe.image}`
      : null;

  return (
    <Card
      className="recipe-card"
      sx={{
        height: "100%",
        minHeight: 520,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        sx={{ height: 220, minHeight: 220, maxHeight: 220, overflow: "hidden" }}
      >
        {imageUrl ? (
          <CardMedia
            component="img"
            image={imageUrl}
            alt={recipe.title}
            sx={{
              height: "100%",
              width: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        ) : (
          <Box sx={{ height: "100%", width: "100%", bgcolor: "grey.300" }} />
        )}
      </Box>

      <CardContent
        sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}
      >
        <Typography variant="h6" gutterBottom noWrap>
          {recipe.title}
        </Typography>

        <Typography variant="body2" color="text.secondary" gutterBottom>
          Категории:{" "}
          {Array.isArray(recipe.categories) && recipe.categories.length
            ? recipe.categories.map((c) => c.name).join(", ")
            : "—"}
        </Typography>

        <Typography variant="body2" color="text.secondary" gutterBottom>
          Автор: {recipe.author_username}
        </Typography>

        <Typography
          variant="body1"
          sx={{
            mt: 1,
            minHeight: 72,
            maxHeight: 72,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
          }}
        >
          {recipe.description}
        </Typography>
      </CardContent>

      <CardActions sx={{ mt: "auto" }}>
        <Button component={Link} to={`/recipes/${recipe.id}`} size="small">
          Подробнее
        </Button>
      </CardActions>
    </Card>
  );
}
