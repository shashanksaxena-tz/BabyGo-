import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'services/storage_service.dart';
import 'utils/app_theme.dart';
import 'screens/onboarding/onboarding_screen.dart';
import 'screens/home/home_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Set preferred orientations
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  // Set system UI overlay style
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
      systemNavigationBarColor: Colors.white,
      systemNavigationBarIconBrightness: Brightness.dark,
    ),
  );

  // Initialize storage
  final storage = StorageService();
  await storage.initialize();

  runApp(TinyStepsApp(storage: storage));
}

class TinyStepsApp extends StatelessWidget {
  final StorageService storage;

  const TinyStepsApp({super.key, required this.storage});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'TinySteps AI',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      home: _buildInitialScreen(),
    );
  }

  Widget _buildInitialScreen() {
    // Check if onboarding is complete
    if (storage.isOnboardingComplete()) {
      return const HomeScreen();
    }
    return const OnboardingScreen();
  }
}
