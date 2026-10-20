import { Routes, Route } from "react-router-dom";
import { Container } from "@mui/material";
import Header from "./components/Header";
import HomePage from "./pages/HomePage";
import RecipeDetailPage from "./pages/RecipeDetailPage";
import CreateRecipePage from "./pages/CreateRecipePage";
import MyRecipesPage from "./pages/MyRecipesPage";
import EditRecipePage from "./pages/EditRecipePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProfilePage from "./pages/ProfilePage";

export default function App() {
  return (
    <>
      <Header />
      <Container sx={{ mt: 4 }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/recipes/:id" element={<RecipeDetailPage />} />
          <Route path="/create" element={<CreateRecipePage />} />
          <Route path="/my-recipes" element={<MyRecipesPage />} />

          {/* Auth routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/recipes/:id/edit" element={<EditRecipePage />} />
        </Routes>
      </Container>
    </>
  );
}
