from django.contrib import admin

from .models import Category, Ingredient, Recipe, RecipeIngredient


class RecipeIngredientInline(admin.TabularInline):
    model = RecipeIngredient
    extra = 1


@admin.register(Ingredient)
class IngredientAdmin(admin.ModelAdmin):
    list_display = ("id", "name")
    search_fields = ("name",)


@admin.register(Recipe)
class RecipeAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "author", "created_at", "categories_list")
    list_filter = ("categories", "created_at")
    search_fields = ("title", "description", "categories__name")
    inlines = [RecipeIngredientInline]
    filter_horizontal = ("categories",)

    def categories_list(self, obj):
        return ", ".join(obj.categories.values_list("name", flat=True))

    categories_list.short_description = "Категории"


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "slug")
    search_fields = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}


@admin.register(RecipeIngredient)
class RecipeIngredientAdmin(admin.ModelAdmin):
    list_display = ("id", "recipe", "ingredient", "amount", "unit")
    search_fields = ("recipe__title", "ingredient__name")
