/// API Configuration for TinySteps AI
///
/// Configure the backend API URL based on your deployment environment.
class ApiConfig {
  /// Development server (local)
  static const String developmentUrl = 'http://localhost:3001/api';

  /// Android emulator (use 10.0.2.2 to access host machine localhost)
  static const String androidEmulatorUrl = 'http://10.0.2.2:3001/api';

  /// iOS simulator (use localhost directly)
  static const String iosSimulatorUrl = 'http://localhost:3001/api';

  /// Production URL (replace with your actual deployed backend URL)
  static const String productionUrl = 'https://api.tinysteps.ai/api';

  /// Current environment setting
  /// Change this to switch between environments
  static const Environment currentEnvironment = Environment.development;

  /// Get the API URL for the current environment
  static String get apiUrl {
    switch (currentEnvironment) {
      case Environment.development:
        return developmentUrl;
      case Environment.androidEmulator:
        return androidEmulatorUrl;
      case Environment.iosSimulator:
        return iosSimulatorUrl;
      case Environment.production:
        return productionUrl;
    }
  }
}

enum Environment {
  development,
  androidEmulator,
  iosSimulator,
  production,
}
