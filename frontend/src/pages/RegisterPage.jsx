import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Typography,
  TextField,
  Button,
  Box,
  Paper,
  Alert,
} from "@mui/material";
import api from "../api/axios";

export default function RegisterPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    password_repeat: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
    setSuccessMessage(null);
  };

  const validate = () => {
    if (!form.username.trim()) {
      setError("Введите имя пользователя.");
      return false;
    }
    if (!form.password) {
      setError("Введите пароль.");
      return false;
    }
    if (form.password !== form.password_repeat) {
      setError("Пароли не совпадают.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!validate()) return;

    setLoading(true);
    try {
      const payload = {
        username: form.username,
        email: form.email,
        password: form.password,
        password_repeat: form.password_repeat,
      };

      // API path: baseURL is http://127.0.0.1:8000/api
      // users app is included under /api/users/, so register endpoint is /api/users/register/
      const response = await api.post("/users/register/", payload);

      setSuccessMessage(
        response?.data?.message || "Пользователь успешно зарегистрирован."
      );

      // Optionally redirect to login after short delay
      setTimeout(() => {
        navigate("/login");
      }, 1000);
    } catch (err) {
      const serverMessage =
        err?.response?.data?.error ||
        err?.response?.data?.detail ||
        (err?.response?.data &&
          typeof err.response.data === "object" &&
          Object.values(err.response.data).flat().join(" ")) ||
        err.message ||
        "Ошибка при регистрации.";
      setError(serverMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 4, maxWidth: 600, margin: "0 auto" }}>
      <Typography variant="h4" gutterBottom>
        Регистрация
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {successMessage}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <TextField
          fullWidth
          label="Имя пользователя"
          name="username"
          value={form.username}
          onChange={handleChange}
          margin="normal"
          required
        />

        <TextField
          fullWidth
          label="Email (не обязательно)"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          margin="normal"
        />

        <TextField
          fullWidth
          label="Пароль"
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          margin="normal"
          required
        />

        <TextField
          fullWidth
          label="Повторите пароль"
          name="password_repeat"
          type="password"
          value={form.password_repeat}
          onChange={handleChange}
          margin="normal"
          required
        />

        <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{ flexGrow: 1 }}
          >
            {loading ? "Регистрация..." : "Зарегистрироваться"}
          </Button>

          <Button
            variant="outlined"
            component={Link}
            to="/login"
            sx={{ flexGrow: 1 }}
          >
            Войти
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}
