import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Typography,
  TextField,
  Button,
  Box,
  MenuItem,
  Paper,
  Chip,
} from "@mui/material";
import api from "../api/axios";

export default function CreateRecipePage() {
  const [form, setForm] = useState({
    title: "",
    category_ids: [],
    description: "",
    steps: "",
  });

  const [imageFile, setImageFile] = useState(null);

  const handleImageChange = (e) => {
    setImageFile(e.target.files[0] || null);
  };

  const [ingredients, setIngredients] = useState([
    { name: "", amount: "", unit: "" },
  ]);

  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [availableCategories, setAvailableCategories] = useState([]);

  useEffect(() => {
    let mounted = true;
    // Try to fetch current profile to determine whether user is authenticated.
    api
      .get("/users/profile/")
      .then((res) => {
        if (!mounted) return;
        setUser(res.data);
      })
      .catch(() => {
        if (!mounted) return;
        setUser(null);
      })
      .finally(() => {
        if (!mounted) return;
        setLoadingAuth(false);
      });

    api
      .get("/categories/")
      .then((res) => {
        if (!mounted) return;
        setAvailableCategories(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => {
        if (!mounted) return;
        setAvailableCategories([]);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Inject a small global CSS tweak to ensure card images use a uniform height (200px)
  // This targets Material-UI CardMedia root and img so cards display consistently.
  useEffect(() => {
    const css = `
      .MuiCardMedia-root, .MuiCardMedia-root img {
        height: 200px !important;
        max-height: 200px !important;
        object-fit: cover !important;
        width: 100% !important;
        display: block !important;
      }
    `;
    const style = document.createElement("style");
    style.setAttribute("data-created-by", "create-recipe-auth-style");
    style.innerHTML = css;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleIngredientChange = (index, field, value) => {
    const updated = [...ingredients];
    updated[index][field] = value;
    setIngredients(updated);
  };

  const addIngredient = () => {
    setIngredients([...ingredients, { name: "", amount: "", unit: "" }]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const formData = new FormData();
      formData.append("title", form.title);
      (form.category_ids || []).forEach((id) => {
        formData.append("category_ids", id);
      });
      formData.append("description", form.description);
      formData.append("steps", form.steps);

      if (imageFile) {
        formData.append("image", imageFile);
      }

      // send ingredients as JSON string so backend can parse it when using multipart
      formData.append("ingredients_data", JSON.stringify(ingredients));

      await api.post("/recipes/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("Рецепт успешно создан");
      setForm({
        title: "",
        category_ids: [],
        description: "",
        steps: "",
      });
      setIngredients([{ name: "", amount: "", unit: "" }]);
      setImageFile(null);
    } catch (error) {
      console.error("Ошибка создания рецепта:", error);
      alert("Не удалось создать рецепт");
    }
  };

  return (
    <Paper sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        Создание рецепта
      </Typography>

      <Box component="form" onSubmit={handleSubmit}>
        <TextField
          fullWidth
          label="Название"
          name="title"
          value={form.title}
          onChange={handleChange}
          margin="normal"
        />

        <TextField
          fullWidth
          select
          label="Категории"
          name="category_ids"
          value={form.category_ids}
          onChange={(e) => setForm({ ...form, category_ids: e.target.value })}
          margin="normal"
          SelectProps={{
            multiple: true,
            renderValue: (selected) => (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                {selected.map((id) => {
                  const categoryObj = availableCategories.find(
                    (c) => c.id === id || String(c.id) === String(id),
                  );
                  return (
                    <Chip
                      key={id}
                      label={categoryObj ? categoryObj.name : id}
                      size="small"
                    />
                  );
                })}
              </Box>
            ),
          }}
        >
          {availableCategories.map((cat) => (
            <MenuItem key={cat.id} value={cat.id}>
              {cat.name}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          fullWidth
          label="Описание"
          name="description"
          value={form.description}
          onChange={handleChange}
          margin="normal"
          multiline
          rows={3}
        />

        <TextField
          fullWidth
          label="Шаги приготовления"
          name="steps"
          value={form.steps}
          onChange={handleChange}
          margin="normal"
          multiline
          rows={5}
        />

        <Box sx={{ mt: 2, mb: 2 }}>
          <input
            accept="image/*"
            id="image-upload"
            type="file"
            onChange={handleImageChange}
          />
          {imageFile && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Выбран файл: {imageFile.name}
            </Typography>
          )}
        </Box>

        <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
          Ингредиенты
        </Typography>

        {ingredients.map((ingredient, index) => (
          <Box key={index} sx={{ display: "flex", gap: 2, mb: 2 }}>
            <TextField
              label="Название"
              value={ingredient.name}
              onChange={(e) =>
                handleIngredientChange(index, "name", e.target.value)
              }
            />
            <TextField
              label="Количество"
              value={ingredient.amount}
              onChange={(e) =>
                handleIngredientChange(index, "amount", e.target.value)
              }
            />
            <TextField
              label="Единица"
              value={ingredient.unit}
              onChange={(e) =>
                handleIngredientChange(index, "unit", e.target.value)
              }
            />
          </Box>
        ))}

        {!loadingAuth && !user && (
          <div style={{ marginBottom: 12 }}>
            <Typography color="error" sx={{ display: "inline", mr: 2 }}>
              Пожалуйста, войдите, чтобы создать рецепт.
            </Typography>
            <Button
              component={Link}
              to="/login"
              variant="outlined"
              size="small"
              sx={{ verticalAlign: "middle" }}
            >
              Войти
            </Button>
          </div>
        )}

        <Button
          variant="outlined"
          onClick={addIngredient}
          sx={{ mt: 1, mr: 2 }}
          disabled={!user}
        >
          Добавить ингредиент
        </Button>

        <Button
          type="submit"
          variant="contained"
          sx={{ mt: 1 }}
          disabled={!user}
        >
          Сохранить рецепт
        </Button>
      </Box>
    </Paper>
  );
}
