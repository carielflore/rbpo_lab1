import json
import re

from rest_framework import serializers

from .models import Category, Ingredient, Recipe, RecipeIngredient


class IngredientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ingredient
        fields = ["id", "name"]


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "slug"]


class RecipeIngredientReadSerializer(serializers.ModelSerializer):
    ingredient_id = serializers.IntegerField(source="ingredient.id", read_only=True)
    ingredient_name = serializers.CharField(source="ingredient.name", read_only=True)

    class Meta:
        model = RecipeIngredient
        fields = ["ingredient_id", "ingredient_name", "amount", "unit"]


class RecipeIngredientWriteSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    amount = serializers.CharField(max_length=100, required=False, allow_blank=True)
    unit = serializers.CharField(max_length=50, required=False, allow_blank=True)


class RecipeSerializer(serializers.ModelSerializer):
    author_username = serializers.CharField(source="author.username", read_only=True)
    ingredients = RecipeIngredientReadSerializer(
        source="recipe_ingredients", many=True, read_only=True
    )
    categories = CategorySerializer(many=True, read_only=True)
    category_ids = serializers.PrimaryKeyRelatedField(
        source="categories",
        many=True,
        queryset=Category.objects.all(),
        write_only=True,
        required=False,
    )
    ingredients_data = RecipeIngredientWriteSerializer(
        many=True, write_only=True, required=False
    )

    class Meta:
        model = Recipe
        fields = [
            "id",
            "author",
            "author_username",
            "title",
            "categories",
            "category_ids",
            "description",
            "steps",
            "image",
            "created_at",
            "ingredients",
            "ingredients_data",
        ]
        read_only_fields = ["id", "author", "author_username", "created_at"]

    def to_internal_value(self, data):
        """
        Pre-parse 'ingredients_data' when the client sends it as a JSON string
        (common when using multipart/form-data and FormData). Convert the JSON
        string into a Python list so DRF field validation receives the correct
        type (list) instead of a raw string.
        """
        # Only attempt when data looks like a mapping and contains the key
        try:
            raw = data.get("ingredients_data") if hasattr(data, "get") else None
        except Exception:
            raw = None

        if isinstance(raw, str):
            try:
                parsed = json.loads(raw)
                if isinstance(parsed, list):
                    # Don't mutate original QueryDict; copy if possible
                    if hasattr(data, "copy"):
                        data = data.copy()
                    # For QueryDict use setlist to preserve list type for DRF validation
                    if hasattr(data, "setlist"):
                        data.setlist("ingredients_data", parsed)
                    else:
                        data["ingredients_data"] = parsed
            except Exception:
                # If parsing fails, fall back to original data (validation will handle it)
                pass

        # Normalize category_ids from multipart/form-data:
        # - "2" -> [2]
        # - "[1,2]" -> [1,2]
        # - already-list -> keep as is
        try:
            raw_category_ids = (
                data.get("category_ids") if hasattr(data, "get") else None
            )
        except Exception:
            raw_category_ids = None

        if raw_category_ids is not None:
            normalized_category_ids = None

            if isinstance(raw_category_ids, str):
                parsed_value = None
                try:
                    parsed_value = json.loads(raw_category_ids)
                except Exception:
                    parsed_value = raw_category_ids

                if isinstance(parsed_value, list):
                    normalized_category_ids = parsed_value
                else:
                    normalized_category_ids = [parsed_value]

            elif isinstance(raw_category_ids, list):
                normalized_category_ids = raw_category_ids

            if normalized_category_ids is not None:
                if hasattr(data, "copy"):
                    data = data.copy()
                if hasattr(data, "setlist"):
                    data.setlist("category_ids", normalized_category_ids)
                else:
                    data["category_ids"] = normalized_category_ids

        return super().to_internal_value(data)

    def _normalize_ingredients_data(self, ingredients_data):
        """
        Normalize various incoming shapes for ingredients_data so create/update
        can work regardless of whether the frontend sent:
        - a JSON string: 'ingredients_data': '[{"name":"X","amount":"1"}]'
        - form-encoded bracketed keys produced by multipart: 'ingredients_data[0][name]': 'X'
        - a list of dicts already
        - a QueryDict-like mapping
        Returns a list of dicts or empty list.
        """
        if ingredients_data is None:
            return []

        # If it's a JSON string, try to parse it
        if isinstance(ingredients_data, str):
            try:
                parsed = json.loads(ingredients_data)
                if isinstance(parsed, list):
                    return parsed
            except (ValueError, TypeError):
                pass

        # If it's already a list, assume it's the correct shape
        if isinstance(ingredients_data, list):
            return ingredients_data

        # If it's dict-like (QueryDict or dict) with bracketed keys like
        # ingredients_data[0][name] = 'Sugar', reconstruct the list
        if hasattr(ingredients_data, "items"):
            pattern = re.compile(r"ingredients_data\[(\d+)\]\[(\w+)\]")
            items_by_index = {}
            for key, value in ingredients_data.items():
                m = pattern.match(key)
                if not m:
                    continue
                idx = int(m.group(1))
                field = m.group(2)
                # value may be a list (QueryDict), take first element
                val = value[0] if isinstance(value, (list, tuple)) else value
                items_by_index.setdefault(idx, {})[field] = val

            if items_by_index:
                return [items_by_index[i] for i in sorted(items_by_index.keys())]

        # Could not normalize - return empty list as safe fallback
        return []

    def create(self, validated_data):
        """
        Create a Recipe. `ingredients_data` is optional in validated_data:
        - if present, normalize and use it,
        - if missing (common with multipart/form-data), attempt to extract from
          `initial_data` or the request data (available via serializer context).
        """
        ingredients_data = validated_data.pop("ingredients_data", None)

        # If ingredients_data was not provided in validated_data, try to find it
        # in initial_data (serializer input) or request.data (useful for multipart).
        if ingredients_data is None:
            raw_source = None
            # Prefer explicit top-level ingredients_data in initial_data
            if hasattr(self, "initial_data") and self.initial_data:
                # initial_data may be a dict or QueryDict
                if (
                    isinstance(self.initial_data, dict)
                    and "ingredients_data" in self.initial_data
                ):
                    raw_source = self.initial_data.get("ingredients_data")
                else:
                    raw_source = self.initial_data
            # Fallback to request.data if available in context
            request = (
                self.context.get("request") if isinstance(self.context, dict) else None
            )
            if raw_source is None and request is not None:
                raw_source = getattr(request, "data", None)

            ingredients_data = self._normalize_ingredients_data(raw_source)
        else:
            ingredients_data = self._normalize_ingredients_data(ingredients_data)

        categories = validated_data.pop("categories", [])
        recipe = Recipe.objects.create(**validated_data)
        if categories:
            recipe.categories.set(categories)

        for item in ingredients_data:
            # be defensive about missing or malformed items
            name = item.get("name") if isinstance(item, dict) else ""
            ingredient_name = (name or "").strip()
            if not ingredient_name:
                continue
            ingredient, _ = Ingredient.objects.get_or_create(name=ingredient_name)
            RecipeIngredient.objects.create(
                recipe=recipe,
                ingredient=ingredient,
                amount=item.get("amount", "") if isinstance(item, dict) else "",
                unit=item.get("unit", "") if isinstance(item, dict) else "",
            )
        return recipe

    def update(self, instance, validated_data):
        """
        Update a Recipe. `ingredients_data` is optional; if omitted we attempt to
        obtain it from the serializer's initial_data or from the request payload.
        """
        ingredients_data = validated_data.pop("ingredients_data", None)

        # If caller did provide ingredients_data explicitly, normalize it.
        # Otherwise attempt to find ingredients in initial_data or request.data.
        if ingredients_data is not None:
            ingredients_data = self._normalize_ingredients_data(ingredients_data)
        else:
            raw_source = None
            if hasattr(self, "initial_data") and self.initial_data:
                if (
                    isinstance(self.initial_data, dict)
                    and "ingredients_data" in self.initial_data
                ):
                    raw_source = self.initial_data.get("ingredients_data")
                else:
                    raw_source = self.initial_data
            request = (
                self.context.get("request") if isinstance(self.context, dict) else None
            )
            if raw_source is None and request is not None:
                raw_source = getattr(request, "data", None)
            ingredients_data = self._normalize_ingredients_data(raw_source)

        categories = validated_data.pop("categories", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if categories is not None:
            instance.categories.set(categories)

        # If ingredients_data is present (may be empty list), replace related items.
        if ingredients_data is not None:
            instance.recipe_ingredients.all().delete()
            for item in ingredients_data:
                # be defensive about missing or malformed items
                name = item.get("name") if isinstance(item, dict) else ""
                ingredient_name = (name or "").strip()
                if not ingredient_name:
                    continue
                ingredient, _ = Ingredient.objects.get_or_create(name=ingredient_name)
                RecipeIngredient.objects.create(
                    recipe=instance,
                    ingredient=ingredient,
                    amount=item.get("amount", "") if isinstance(item, dict) else "",
                    unit=item.get("unit", "") if isinstance(item, dict) else "",
                )

        return instance
