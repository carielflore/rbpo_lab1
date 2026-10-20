import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
} from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api/axios";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";

export default function Header() {
  const [user, setUser] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/users/profile/");
        setUser(res.data);
      } catch (err) {
        setUser(null);
      }
    };

    fetchProfile();
  }, []);

  const handleLogout = async () => {
    try {
      const res = await api.post("/users/logout/");
      setUser(null);
      if (res && res.data && res.data.reload) {
        window.location.reload();
      } else {
        navigate("/");
      }
    } catch (err) {
      console.error("Ошибка выхода:", err);
    }
  };

  const toggleDrawer = (open) => () => {
    setDrawerOpen(open);
  };

  const menuItems = [
    { label: "Главная", to: "/" },
    { label: "Создать рецепт", to: "/create" },
    { label: "Мои рецепты", to: "/my-recipes" },
  ];

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          {isSmall && (
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={toggleDrawer(true)}
              sx={{ mr: 1 }}
            >
              <span style={{ fontSize: 24, lineHeight: 1 }}>&#9776;</span>
            </IconButton>
          )}

          <Typography
            variant="h6"
            component={Link}
            to="/"
            sx={{
              flexGrow: 1,
              color: "inherit",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            MyFood
          </Typography>

          {!isSmall && (
            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              {menuItems.map((it) => (
                <Button key={it.to} color="inherit" component={Link} to={it.to}>
                  {it.label}
                </Button>
              ))}

              {user ? (
                <>
                  <Button color="inherit" component={Link} to="/profile">
                    {user.username}
                  </Button>
                  <Button color="inherit" onClick={handleLogout}>
                    Выйти
                  </Button>
                </>
              ) : (
                <>
                  <Button color="inherit" component={Link} to="/register">
                    Регистрация
                  </Button>
                  <Button color="inherit" component={Link} to="/login">
                    Вход
                  </Button>
                </>
              )}
            </Box>
          )}
        </Toolbar>
      </AppBar>

      <Drawer anchor="left" open={drawerOpen} onClose={toggleDrawer(false)}>
        <Box
          sx={{ width: 240 }}
          role="presentation"
          onClick={toggleDrawer(false)}
          onKeyDown={toggleDrawer(false)}
        >
          <List>
            {menuItems.map((it) => (
              <ListItem key={it.to} disablePadding>
                <ListItemButton component={Link} to={it.to}>
                  <ListItemText primary={it.label} />
                </ListItemButton>
              </ListItem>
            ))}

            <ListItem disablePadding>
              {user ? (
                <ListItemButton component={Link} to="/profile">
                  <ListItemText primary={user.username} />
                </ListItemButton>
              ) : (
                <ListItemButton component={Link} to="/login">
                  <ListItemText primary="Войти" />
                </ListItemButton>
              )}
            </ListItem>

            {user && (
              <ListItem disablePadding>
                <ListItemButton onClick={handleLogout}>
                  <ListItemText primary="Выйти" />
                </ListItemButton>
              </ListItem>
            )}
          </List>
        </Box>
      </Drawer>
    </>
  );
}
