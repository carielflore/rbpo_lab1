import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  Stack,
} from "@mui/material";
import api from "../api/axios";

export default function LoginPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!form.username || !form.password) {
      setError("Пожалуйста, введите имя пользователя и пароль.");
      return;
    }

    setLoading(true);
    try {
      // Backend routes are mounted under /api/users/
      const response = await api.post("/users/login/", {
        username: form.username,
        password: form.password,
      });

      // If server returns user data, set a success message and navigate to home.
      // Then reload the page so the browser sends the session cookie and Header
      // re-fetches the profile from the API.
      setSuccessMsg(response.data?.message || "Успешный вход в систему.");
      // Redirect to home and force a reload so Header will fetch the authenticated profile.
      window.location.href = "/";
    } catch (err) {
      // Try to extract a helpful message from the response
      const resp = err?.response?.data;
      if (resp) {
        if (typeof resp === "string") {
          setError(resp);
        } else if (resp.error) {
          setError(resp.error);
        } else if (resp.detail) {
          setError(resp.detail);
        } else if (resp.non_field_errors) {
          setError(resp.non_field_errors.join(" "));
        } else {
          // fallback: show combined messages
          const combined = Object.values(resp).flat().join(" ");
          setError(
            combined || "Ошибка входа. Проверьте данные и попробуйте снова.",
          );
        }
      } else {
        setError("Ошибка соединения с сервером. Проверьте сеть.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 4, maxWidth: 600, mx: "auto" }}>
      <Typography variant="h4" gutterBottom>
        Вход
      </Typography>

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Stack spacing={2}>
          {error && <Alert severity="error">{error}</Alert>}
          {successMsg && <Alert severity="success">{successMsg}</Alert>}

          <TextField
            label="Имя пользователя"
            name="username"
            value={form.username}
            onChange={handleChange}
            fullWidth
            autoComplete="username"
          />

          <TextField
            label="Пароль"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            fullWidth
            autoComplete="current-password"
          />

          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? "Входим..." : "Войти"}
            </Button>

            <Button
              component={Link}
              to="/register"
              variant="outlined"
              disabled={loading}
            >
              Регистрация
            </Button>
          </Box>
        </Stack>
      </Box>
    </Paper>
  );
}
