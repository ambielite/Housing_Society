# housing_society_app

A new Flutter project.

## Deployment configuration

Build deployed web and mobile clients with `--dart-define=API_BASE_URL=https://<your-api-host>/api/v1` so authentication and password recovery use the deployed backend. Do not use the local development fallback addresses in a production build.

The backend must have the database migrations applied and its environment must set `GMAIL_SMTP_USER` and `GMAIL_SMTP_APP_PASSWORD` for the manager-provided Gmail account. Use a Google App Password, not the account's regular password. Gmail SMTP sends resident password recovery codes and other email notifications from the authenticated Gmail account; each recovery code is single-use, expires after 10 minutes, and is limited to five guesses. Keep credentials in backend environment variables and configure the same variables in the deployment environment. Missing or failed email configuration returns an error instead of pretending that a message was sent.

## Getting Started

This project is a starting point for a Flutter application.

A few resources to get you started if this is your first Flutter project:

- [Learn Flutter](https://docs.flutter.dev/get-started/learn-flutter)
- [Write your first Flutter app](https://docs.flutter.dev/get-started/codelab)
- [Flutter learning resources](https://docs.flutter.dev/reference/learning-resources)

For help getting started with Flutter development, view the
[online documentation](https://docs.flutter.dev/), which offers tutorials,
samples, guidance on mobile development, and a full API reference.
