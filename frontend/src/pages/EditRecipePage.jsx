import { useEffect, useState } from "react";
import {
  Typography,
  TextField,
  Button,
  Box,
  MenuItem,
  Paper,
  CircularProgress,
  Grid,
  Chip,
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function EditRecipePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    title: "",
    category_ids: [],
    description: "",
    steps: "",
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [ingredients, setIngredients] = useState([
    { name: "", amount: "", unit: "" },
  ]);
  const [availableCategories, setAvailableCategories] = useState([]);

  useEffect(() => {
    let mounted = true;
    const fetchRecipe = async () => {
      try {
        const res = await api.get(`/recipes/${id}/`);
        if (!mounted) return;
        const data = res.data;
        setForm({
          title: data.title || "",
          category_ids: Array.isArray(data.categories)
            ? data.categories.map((c) => c.id)
            : [],
          description: data.description || "",
          steps: data.steps || "",
        });

        // map incoming ingredients (read serializer sends ingredient_name, amount, unit)
        if (Array.isArray(data.ingredients) && data.ingredients.length > 0) {
          setIngredients(
            data.ingredients.map((it) => ({
              name: it.ingredient_name || "",
              amount: it.amount || "",
              unit: it.unit || "",
            })),
          );
        } else {
          setIngredients([{ name: "", amount: "", unit: "" }]);
        }

        // image preview URL
        if (data.image) {
          setImagePreview(
            data.image.startsWith("http")
              ? data.image
              : `http://localhost:8000${data.image}`,
          );
        } else {
          setImagePreview(null);
        }

        setError(null);
      } catch (err) {
        console.error("Ошибка загрузки рецепта:", err);
        setError("Не удалось загрузить рецепт.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchRecipe();

    const fetchCategories = async () => {
      try {
        const res = await api.get("/categories/");
        if (!mounted) return;
        setAvailableCategories(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        if (!mounted) return;
        setAvailableCategories([]);
      }
    };

    fetchCategories();
    return () => {
      mounted = false;
    };
  }, [id]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleIngredientChange = (index, field, value) => {
    const updated = [...ingredients];
    updated[index][field] = value;
    setIngredients(updated);
  };

  const addIngredient = () =>
    setIngredients([...ingredients, { name: "", amount: "", unit: "" }]);

  const removeIngredient = (index) => {
    const updated = ingredients.filter((_, i) => i !== index);
    setIngredients(
      updated.length ? updated : [{ name: "", amount: "", unit: "" }],
    );
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0] || null;
    setImageFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    }
  };

  const preflightCsrf = async () => {
    try {
      await api.get("/users/csrf/");
    } catch (err) {
      // ignore
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await preflightCsrf();

      const formData = new FormData();
      formData.append("title", form.title);
      (form.category_ids || []).forEach((id) => {
        formData.append("category_ids", id);
      });
      formData.append("description", form.description);
      formData.append("steps", form.steps);
      if (imageFile) formData.append("image", imageFile);
      formData.append("ingredients_data", JSON.stringify(ingredients));

      // PATCH to update
      const res = await api.put(`/recipes/${id}/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // On success navigate to detail or my-recipes
      navigate(`/recipes/${id}`);
    } catch (err) {
      console.error("Ошибка сохранения рецепта:", err);
      const data = err?.response?.data;
      if (data && data.detail) setError(data.detail);
      else if (data) setError(JSON.stringify(data));
      else setError("Не удалось сохранить рецепт.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Вы действительно хотите удалить этот рецепт?")) return;
    setDeleting(true);
    try {
      await preflightCsrf();
      await api.delete(`/recipes/${id}/`);
      navigate("/my-recipes");
    } catch (err) {
      console.error("Ошибка удаления:", err);
      setError("Не удалось удалить рецепт.");
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        Редактирование рецепта
      </Typography>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <Box component="form" onSubmit={handleSave} encType="multipart/form-data">
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
          onChange={(e) =>
            setForm((prev) => ({ ...prev, category_ids: e.target.value }))
          }
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
          <input accept="image/*" type="file" onChange={handleImageChange} />
          {imagePreview && (
            <Box sx={{ mt: 1 }}>
              <img
                src={imagePreview}
                alt="preview"
                style={{ maxWidth: "100%", maxHeight: 300, objectFit: "cover" }}
              />
            </Box>
          )}
        </Box>

        <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
          Ингредиенты
        </Typography>

        {ingredients.map((ingredient, index) => (
          <Grid container spacing={2} key={index} sx={{ mb: 1 }}>
            <Grid item xs={12} sm={6} md={6}>
              <TextField
                fullWidth
                label="Название"
                value={ingredient.name}
                onChange={(e) =>
                  handleIngredientChange(index, "name", e.target.value)
                }
              />
            </Grid>
            <Grid item xs={6} sm={3} md={3}>
              <TextField
                fullWidth
                label="Количество"
                value={ingredient.amount}
                onChange={(e) =>
                  handleIngredientChange(index, "amount", e.target.value)
                }
              />
            </Grid>
            <Grid
              item
              xs={6}
              sm={3}
              md={3}
              sx={{ display: "flex", alignItems: "center" }}
            >
              <TextField
                fullWidth
                label="Единица"
                value={ingredient.unit}
                onChange={(e) =>
                  handleIngredientChange(index, "unit", e.target.value)
                }
              />
            </Grid>
            <Grid
              item
              xs={12}
              sx={{ display: "flex", justifyContent: "flex-end" }}
            >
              <Button
                color="error"
                onClick={() => removeIngredient(index)}
                disabled={ingredients.length === 1}
              >
                Удалить
              </Button>
            </Grid>
          </Grid>
        ))}

        <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
          <Button variant="outlined" onClick={addIngredient}>
            Добавить ингредиент
          </Button>

          <Box sx={{ flexGrow: 1 }} />

          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "Удаление..." : "Удалить рецепт"}
          </Button>

          <Button type="submit" variant="contained" disabled={saving}>
            {saving ? "Сохранение..." : "Сохранить"}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}
