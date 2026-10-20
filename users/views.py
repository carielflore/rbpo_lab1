from django.contrib.auth import authenticate, login, logout
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt, ensure_csrf_cookie
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import RegisterSerializer, UserSerializer


@api_view(["GET"])
@ensure_csrf_cookie
def get_csrf(request):
    # Simple endpoint to set csrftoken cookie for SPA clients.
    # Call this (GET /api/users/csrf/) before POSTing forms so the browser
    # receives a 'csrftoken' cookie that axios can send back as X-CSRFToken.
    return Response({"detail": "CSRF cookie set"})


@method_decorator(csrf_exempt, name="dispatch")
class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {
                "message": "Пользователь успешно зарегистрирован.",
                "user": UserSerializer(user).data,
            },
            status=status.HTTP_201_CREATED,
        )


@method_decorator(csrf_exempt, name="dispatch")
class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        # Ensure any existing session is cleared before attempting a new login.
        # This prevents the client from staying authenticated as a previous admin/session.
        try:
            logout(request)
        except Exception:
            # If logout fails for any reason, continue — authenticate will handle correctness.
            pass

        username = request.data.get("username")
        password = request.data.get("password")

        user = authenticate(request, username=username, password=password)

        if user is None:
            return Response(
                {"error": "Неверный логин или пароль."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        login(request, user)
        return Response(
            {"message": "Успешный вход в систему.", "user": UserSerializer(user).data},
            status=status.HTTP_200_OK,
        )


@method_decorator(csrf_exempt, name="dispatch")
class LogoutView(APIView):
    # Allow any client to call logout; the view will always attempt to clear the session.
    # CSRF exempt so SPA can call logout without CSRF token during development.
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            # Always attempt to clear any existing session for this request.
            logout(request)
        except Exception:
            # Silently ignore logout errors to ensure client receives a success response.
            pass
        # Indicate to the frontend that it should refresh state / reload if needed.
        return Response(
            {"message": "Вы вышли из системы.", "reload": True},
            status=status.HTTP_200_OK,
        )

        # Include a small flag in the response so frontends can decide to reload if desired.
        return Response(
            {"message": "Вы вышли из системы.", "reload": True},
            status=status.HTTP_200_OK,
        )


class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)
