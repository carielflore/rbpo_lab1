from django.contrib.auth.models import User
from django.db import models


class Ingredient(models.Model):
    name = models.CharField(
        max_length=255, unique=True, verbose_name="Название ингредиента"
    )

    class Meta:
        verbose_name = "Ингредиент"
        verbose_name_plural = "Ингредиенты"
        ordering = ["name"]

    def __str__(self):
        return self.name


class Category(models.Model):
    name = models.CharField(
        max_length=100, unique=True, verbose_name="Название категории"
    )
    slug = models.SlugField(max_length=100, unique=True, verbose_name="Слаг")

    class Meta:
        verbose_name = "Категория"
        verbose_name_plural = "Категории"
        ordering = ["name"]

    def __str__(self):
        return self.name


class Recipe(models.Model):
    author = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="recipes", verbose_name="Автор"
    )
    title = models.CharField(max_length=255, verbose_name="Название")
    categories = models.ManyToManyField(
        Category, related_name="recipes", verbose_name="Категории", blank=True
    )
    description = models.TextField(verbose_name="Описание")
    steps = models.TextField(verbose_name="Шаги приготовления")
    image = models.ImageField(
        upload_to="recipes/", blank=True, null=True, verbose_name="Изображение"
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата создания")

    ingredients = models.ManyToManyField(
        Ingredient,
        through="RecipeIngredient",
        related_name="recipes",
        verbose_name="Ингредиенты",
    )

    class Meta:
        verbose_name = "Рецепт"
        verbose_name_plural = "Рецепты"
        ordering = ["-created_at"]

    def __str__(self):
        return self.title


class RecipeIngredient(models.Model):
    recipe = models.ForeignKey(
        Recipe, on_delete=models.CASCADE, related_name="recipe_ingredients"
    )
    ingredient = models.ForeignKey(
        Ingredient, on_delete=models.CASCADE, related_name="ingredient_recipes"
    )
    amount = models.CharField(max_length=100, verbose_name="Количество", blank=True)
    unit = models.CharField(max_length=50, verbose_name="Единица измерения", blank=True)

    class Meta:
        verbose_name = "Ингредиент рецепта"
        verbose_name_plural = "Ингредиенты рецептов"
        unique_together = ("recipe", "ingredient")

    def __str__(self):
        return f"{self.ingredient.name} для {self.recipe.title}"
