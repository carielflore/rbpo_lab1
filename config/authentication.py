"""
Development helper authentication classes.

Contains `CsrfExemptSessionAuthentication` which behaves like
`rest_framework.authentication.SessionAuthentication` but skips the CSRF
enforcement step. THIS IS FOR DEVELOPMENT ONLY — do NOT use in production.

Usage (example, in settings.py for development):
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "config.authentication.CsrfExemptSessionAuthentication",
        "rest_framework.authentication.BasicAuthentication",
    ],
    ...
}
"""

import warnings

from django.conf import settings
from rest_framework.authentication import SessionAuthentication

# Warn if this module is used when DEBUG is False to avoid accidental production use.
if not getattr(settings, "DEBUG", False):
    warnings.warn(
        "CsrfExemptSessionAuthentication is intended for development use only "
        "and should not be used in production. Ensure you replace it with "
        "SessionAuthentication (with proper CSRF protection) before deploying.",
        RuntimeWarning,
    )


class CsrfExemptSessionAuthentication(SessionAuthentication):
    """
    SessionAuthentication subclass that skips CSRF checks.

    Rest framework's `SessionAuthentication` normally enforces CSRF by
    calling `enforce_csrf(request)`. By overriding that method to do
    nothing, we allow session-authenticated requests to succeed without a CSRF token.

    WARNING: disabling CSRF protection is a security risk. Use only in
    local development and testing environments.
    """

    def enforce_csrf(self, request):
        # Intentionally do nothing — bypass CSRF checks.
        return
