from django.urls import path

from .views import (
    CategoryListView,
    IngredientListView,
    MyRecipeListView,
    RecipeDetailView,
    RecipeListCreateView,
)

urlpatterns = [
    path("recipes/", RecipeListCreateView.as_view(), name="recipe-list-create"),
    path("recipes/<int:pk>/", RecipeDetailView.as_view(), name="recipe-detail"),
    path("my-recipes/", MyRecipeListView.as_view(), name="my-recipes"),
    path("ingredients/", IngredientListView.as_view(), name="ingredient-list"),
    path("categories/", CategoryListView.as_view(), name="category-list"),
]
