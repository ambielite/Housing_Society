import 'dart:async';

class SessionManager {
  SessionManager._();

  static final StreamController<void> _expiredController =
      StreamController<void>.broadcast();
  static bool _logoutRequested = false;

  static Stream<void> get onExpired => _expiredController.stream;

  static void expire() {
    if (_logoutRequested) return;
    _logoutRequested = true;
    _expiredController.add(null);
  }

  static void sessionStarted() {
    _logoutRequested = false;
  }
}
