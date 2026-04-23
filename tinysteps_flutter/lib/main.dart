import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'services/storage_service.dart';
import 'services/api_service.dart';
import 'utils/app_theme.dart';
import 'screens/auth/login_screen.dart';
import 'screens/home/home_screen.dart';
import 'screens/insights/development_insights_screen.dart';
import 'screens/profile/profile_screen.dart';
import 'screens/community/community_hub_screen.dart';
import 'widgets/bottom_nav_bar.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Suppress non-critical Flutter web framework assertions (e.g. ViewInsets negativity
  // during browser resize/keyboard dismiss — a known Flutter web engine bug)
  FlutterError.onError = (FlutterErrorDetails details) {
    final message = details.exceptionAsString();
    if (kIsWeb && message.contains('isNonNegative')) {
      // Silently ignore this known Flutter web assertion
      return;
    }
    // Forward all other errors to the default handler
    FlutterError.presentError(details);
  };

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
      systemNavigationBarColor: Color(0xFFF8FAF9),
      systemNavigationBarIconBrightness: Brightness.dark,
    ),
  );

  // Initialize storage
  final storage = StorageService();
  await storage.initialize();

  // Check for saved auth token before app starts
  final prefs = await storage.getPreferences();
  final savedToken = prefs['auth_token'] as String?;
  final hasToken = savedToken != null && savedToken.isNotEmpty;

  if (hasToken) {
    ApiService().setToken(savedToken);
  }

  final isOnboarded = storage.isOnboardingComplete();

  runApp(TinyStepsApp(
    storage: storage,
    isAuthenticated: hasToken || isOnboarded,
  ));
}

class TinyStepsApp extends StatelessWidget {
  final StorageService storage;
  final bool isAuthenticated;

  const TinyStepsApp({
    super.key,
    required this.storage,
    required this.isAuthenticated,
  });

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'TinySteps AI',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      home: isAuthenticated ? const MainAppShell() : const LoginScreen(),
      onGenerateRoute: (settings) {
        switch (settings.name) {
          case '/':
            return MaterialPageRoute(
              builder: (_) =>
                  isAuthenticated ? const MainAppShell() : const LoginScreen(),
            );
          case '/home':
            return MaterialPageRoute(
              builder: (_) => const MainAppShell(),
            );
          case '/login':
            return MaterialPageRoute(
              builder: (_) => const LoginScreen(),
            );
          default:
            return MaterialPageRoute(
              builder: (_) =>
                  isAuthenticated ? const MainAppShell() : const LoginScreen(),
            );
        }
      },
    );
  }
}

/// Main App Shell with 4-tab navigation
/// Tabs: Home, Insights, Community, Profile
/// Uses IndexedStack to preserve state across tab switches
class MainAppShell extends StatefulWidget {
  const MainAppShell({super.key});

  @override
  State<MainAppShell> createState() => _MainAppShellState();
}

class _MainAppShellState extends State<MainAppShell> {
  int _currentIndex = 0;
  String? _currentChildId;

  @override
  void initState() {
    super.initState();
    _loadChildId();
  }

  Future<void> _loadChildId() async {
    final storage = StorageService();
    final childId = storage.getCurrentChildId();

    if (mounted) {
      setState(() {
        _currentChildId = childId;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundV3,
      body: IndexedStack(
        index: _currentIndex,
        children: [
          const HomeScreen(),
          // Insights tab
          _currentChildId != null
              ? DevelopmentInsightsScreen(childId: _currentChildId!)
              : _buildPlaceholderTab('Insights', Icons.psychology_rounded),
          // Community tab
          const CommunityHubScreen(),
          // Profile tab
          const ProfileScreen(),
        ],
      ),
      bottomNavigationBar: BottomNavBar(
        currentIndex: _currentIndex,
        onTap: (index) {
          setState(() => _currentIndex = index);
        },
      ),
    );
  }

  Widget _buildPlaceholderTab(String title, IconData icon) {
    return Container(
      color: AppTheme.backgroundV3,
      child: SafeArea(
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                icon,
                size: 48,
                color: AppTheme.textTertiary,
              ),
              const SizedBox(height: 16),
              Text(
                title,
                style: const TextStyle(
                  fontFamily: 'Nunito',
                  fontSize: 20,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.textSecondary,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Coming soon',
                style: TextStyle(
                  fontFamily: 'Inter',
                  fontSize: 14,
                  color: AppTheme.textTertiary,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
