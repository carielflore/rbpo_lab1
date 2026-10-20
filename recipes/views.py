import json
import logging

from django.contrib.auth.models import User
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework import generics, permissions, status
from rest_framework.response import Response

from .models import Category, Ingredient, Recipe
from .permissions import IsAuthorOrReadOnly
from .serializers import (
    CategorySerializer,
    IngredientSerializer,
    RecipeSerializer,
)


@method_decorator(csrf_exempt, name="dispatch")
class RecipeListCreateView(generics.ListCreateAPIView):
    queryset = Recipe.objects.all()
    serializer_class = RecipeSerializer
    # Allow anyone to view; require authentication to create recipes (CSRF exempt during development)
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = Recipe.objects.all()

        search = self.request.query_params.get("search")
        category = self.request.query_params.get("category")
        categories = self.request.query_params.getlist("categories")
        author = self.request.query_params.get("author")

        if search:
            queryset = queryset.filter(title__icontains=search)

        if category:
            queryset = queryset.filter(categories__slug=category)

        if categories:
            normalized_categories = []
            for c in categories:
                if isinstance(c, str) and "," in c:
                    normalized_categories.extend(
                        [part.strip() for part in c.split(",") if part.strip()]
                    )
                elif c:
                    normalized_categories.append(c)

            if normalized_categories:
                queryset = queryset.filter(
                    categories__slug__in=normalized_categories
                ).distinct()

        if author:
            queryset = queryset.filter(author__username__icontains=author)

        return queryset

    def list(self, request, *args, **kwargs):
        """
        Override list to ensure every recipe object returned has an `image` field.
        If no image is provided, substitute a placeholder image URL so cards remain uniform.
        """
        queryset = self.filter_queryset(self.get_queryset())

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            data = serializer.data
            placeholder = request.build_absolute_uri("/static/placeholder.jpg")
            for item in data:
                if not item.get("image"):
                    item["image"] = placeholder
            return self.get_paginated_response(data)

        serializer = self.get_serializer(queryset, many=True)
        data = serializer.data
        placeholder = request.build_absolute_uri("/static/placeholder.jpg")
        for item in data:
            if not item.get("image"):
                item["image"] = placeholder
        return Response(data)

    def create(self, request, *args, **kwargs):
        """
        Parse incoming request, validate with serializer and create instance.
        Ensure that the recipe author is determined by the current request.user
        (or fallback to a guest user) and not taken from untrusted input.
        """
        # If user not authenticated, reject creation (consistent with permission_classes)
        request_user = getattr(request, "user", None)
        if not (request_user and request_user.is_authenticated):
            return Response(
                {"detail": "Authentication required."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        # Try to log request data succinctly (don't log files contents)
        try:
            data_for_log = {
                k: request.data.getlist(k)
                if hasattr(request.data, "getlist")
                else request.data.get(k)
                for k in list(request.data.keys())
            }
        except Exception:
            try:
                data_for_log = str(request.data)
            except Exception:
                data_for_log = "<unserializable request.data>"
        logging.debug("Recipe.create request data: %s", data_for_log)
        logging.debug("Recipe.create request files: %s", list(request.FILES.keys()))

        # Parse bracketed ingredient fields if present into a list
        parsed_ings = {}
        for key in list(request.data.keys()):
            if not key.startswith("ingredients_data["):
                continue
            try:
                rest = key[len("ingredients_data[") :]  # "<idx>][<field>]"
                idx_part, field_part = rest.split("][", 1)
                idx = int(idx_part.rstrip("]"))
                field = field_part.rstrip("]")
            except Exception:
                continue
            val = request.data.get(key)
            if isinstance(val, (list, tuple)):
                val = val[0]
            parsed_ings.setdefault(idx, {})[field] = val

        ingredients_list = []
        if parsed_ings:
            for i in sorted(parsed_ings.keys()):
                ingredients_list.append(parsed_ings[i])

        # Build input_data for serializer: include non-bracketed fields and files
        input_data = {}
        for key in request.data.keys():
            if key.startswith("ingredients_data["):
                continue
            val = request.data.get(key)
            if isinstance(val, (list, tuple)):
                val = val[0]
            input_data[key] = val

        for fkey in request.FILES.keys():
            input_data[fkey] = request.FILES.get(fkey)

        if ingredients_list:
            input_data["ingredients_data"] = ingredients_list

        # Normalize JSON-string ingredients_data if present (e.g. sent by frontend)
        if "ingredients_data" in input_data and isinstance(
            input_data["ingredients_data"], str
        ):
            try:
                parsed = json.loads(input_data["ingredients_data"])
                if isinstance(parsed, list):
                    input_data["ingredients_data"] = parsed
            except Exception:
                # leave as-is; serializer validation will report a clear error
                pass

        # Validate input
        serializer = self.get_serializer(data=input_data)
        if not serializer.is_valid():
            logging.warning("Recipe creation validation failed: %s", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Determine author from request (do not trust client input)
        author = request_user

        # Create instance using serializer.create with validated data augmented by author
        validated = dict(serializer.validated_data)
        validated["author"] = author
        instance = serializer.create(validated)

        # Return serialized data of the created instance (ensure image placeholder if necessary)
        out_serializer = self.get_serializer(instance)
        data = out_serializer.data
        if not data.get("image"):
            data["image"] = request.build_absolute_uri("/static/placeholder.jpg")
        headers = self.get_success_headers(data)
        return Response(data, status=status.HTTP_201_CREATED, headers=headers)


@method_decorator(csrf_exempt, name="dispatch")
class RecipeDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Recipe.objects.all()
    serializer_class = RecipeSerializer
    permission_classes = [IsAuthorOrReadOnly]


@method_decorator(csrf_exempt, name="dispatch")
class MyRecipeListView(generics.ListAPIView):
    serializer_class = RecipeSerializer
    # Require authentication to view user's recipes
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Recipe.objects.filter(author=self.request.user)


@method_decorator(csrf_exempt, name="dispatch")
class IngredientListView(generics.ListAPIView):
    queryset = Ingredient.objects.all()
    serializer_class = IngredientSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        queryset = Ingredient.objects.all()
        search = self.request.query_params.get("search")

        if search:
            queryset = queryset.filter(name__icontains=search)

        return queryset


@method_decorator(csrf_exempt, name="dispatch")
class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        queryset = Category.objects.all()
        search = self.request.query_params.get("search")

        if search:
            queryset = queryset.filter(name__icontains=search)

        return queryset
