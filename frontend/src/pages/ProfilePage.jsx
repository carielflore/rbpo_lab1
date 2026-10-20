import { useEffect, useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import {
  Paper,
  Typography,
  Button,
  Box,
  CircularProgress,
  Alert,
} from "@mui/material";
import api from "../api/axios";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    async function fetchProfile() {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get("/users/profile/");
        if (!mounted) return;
        setUser(response.data);
      } catch (err) {
        console.error("Failed to fetch profile:", err);
        if (!mounted) return;
        // If unauthorized, backend typically returns 401/403
        setError(
          err.response && err.response.status === 401
            ? "Вы не авторизованы. Пожалуйста, войдите на сайт."
            : "Не удалось загрузить профиль."
        );
        setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchProfile();
    return () => {
      mounted = false;
    };
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await api.post("/users/logout/");
      // After logout redirect to home or login — choose login
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
      setError("Не удалось выйти. Попробуйте ещё раз.");
    } finally {
      setLoggingOut(false);
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
        Профиль
      </Typography>

      {error && (
        <Box sx={{ mb: 2 }}>
          <Alert severity="warning">{error}</Alert>
        </Box>
      )}

      {user ? (
        <>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6">Имя пользователя</Typography>
            <Typography>{user.username}</Typography>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="h6">Email</Typography>
            <Typography>{user.email || "Не указан"}</Typography>
          </Box>

          <Box sx={{ display: "flex", gap: 2, mt: 3 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate("/my-recipes")}
            >
              Мои рецепты
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => navigate("/create")}
            >
              Создать рецепт
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleLogout}
              disabled={loggingOut}
            >
              {loggingOut ? "Выход..." : "Выйти"}
            </Button>
          </Box>
        </>
      ) : (
        <Box sx={{ mt: 2 }}>
          <Typography sx={{ mb: 2 }}>
            Похоже, вы не вошли в систему.
          </Typography>
          <Box sx={{ display: "flex", gap: 2 }}>
            <Button component={RouterLink} to="/login" variant="contained">
              Войти
            </Button>
            <Button component={RouterLink} to="/register" variant="outlined">
              Зарегистрироваться
            </Button>
          </Box>
        </Box>
      )}
    </Paper>
  );
}
