import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:uuid/uuid.dart';
import '../../models/models.dart';
import '../../services/storage_service.dart';
import '../../utils/app_theme.dart';
import '../../animations/custom_animations.dart';
import '../home/home_screen.dart';

class ProfileSetupScreen extends StatefulWidget {
  const ProfileSetupScreen({super.key});

  @override
  State<ProfileSetupScreen> createState() => _ProfileSetupScreenState();
}

class _ProfileSetupScreenState extends State<ProfileSetupScreen>
    with TickerProviderStateMixin {
  final PageController _pageController = PageController();
  int _currentStep = 0;
  final int _totalSteps = 5;

  late AnimationController _progressController;
  late Animation<double> _progressAnimation;

  // Form data
  final _nameController = TextEditingController();
  final _nicknameController = TextEditingController();
  DateTime? _dateOfBirth;
  Gender _gender = Gender.male;
  final _weightController = TextEditingController();
  final _heightController = TextEditingController();
  final _headCircController = TextEditingController();
  WHORegion _region = WHORegion.amro;
  final List<String> _selectedInterests = [];
  final List<String> _favoriteColors = [];
  final List<String> _favoriteCharacters = [];

  @override
  void initState() {
    super.initState();
    _progressController = AnimationController(
      duration: const Duration(milliseconds: 400),
      vsync: this,
    );
    _updateProgress();
  }

  @override
  void dispose() {
    _progressController.dispose();
    _pageController.dispose();
    _nameController.dispose();
    _nicknameController.dispose();
    _weightController.dispose();
    _heightController.dispose();
    _headCircController.dispose();
    super.dispose();
  }

  void _updateProgress() {
    _progressAnimation = Tween<double>(
      begin: _progressAnimation?.value ?? 0,
      end: (_currentStep + 1) / _totalSteps,
    ).animate(CurvedAnimation(
      parent: _progressController,
      curve: Curves.easeOutCubic,
    ));
    _progressController.forward(from: 0);
  }

  void _nextStep() {
    if (_validateCurrentStep()) {
      if (_currentStep < _totalSteps - 1) {
        setState(() => _currentStep++);
        _updateProgress();
        _pageController.nextPage(
          duration: const Duration(milliseconds: 400),
          curve: Curves.easeOutCubic,
        );
      } else {
        _saveProfile();
      }
    }
  }

  void _previousStep() {
    if (_currentStep > 0) {
      setState(() => _currentStep--);
      _updateProgress();
      _pageController.previousPage(
        duration: const Duration(milliseconds: 400),
        curve: Curves.easeOutCubic,
      );
    }
  }

  bool _validateCurrentStep() {
    switch (_currentStep) {
      case 0:
        if (_nameController.text.isEmpty) {
          _showError('Please enter your child\'s name');
          return false;
        }
        if (_dateOfBirth == null) {
          _showError('Please select your child\'s date of birth');
          return false;
        }
        return true;
      case 1:
        if (_weightController.text.isEmpty || _heightController.text.isEmpty) {
          _showError('Please enter weight and height');
          return false;
        }
        return true;
      default:
        return true;
    }
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: AppTheme.error,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }

  Future<void> _saveProfile() async {
    final profile = ChildProfile(
      id: const Uuid().v4(),
      name: _nameController.text.trim(),
      nickname: _nicknameController.text.isEmpty
          ? null
          : _nicknameController.text.trim(),
      dateOfBirth: _dateOfBirth!,
      gender: _gender,
      weight: double.parse(_weightController.text),
      height: double.parse(_heightController.text),
      headCircumference: _headCircController.text.isEmpty
          ? null
          : double.parse(_headCircController.text),
      region: _region,
      interests: _selectedInterests,
      favoriteColors: _favoriteColors,
      favoriteCharacters: _favoriteCharacters,
      favoriteToys: [],
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    );

    final storage = StorageService();
    await storage.saveChild(profile);
    await storage.setCurrentChildId(profile.id);
    await storage.setOnboardingComplete(true);

    if (mounted) {
      Navigator.of(context).pushReplacement(
        PageRouteBuilder(
          pageBuilder: (_, __, ___) => const HomeScreen(),
          transitionsBuilder: (_, animation, __, child) {
            return FadeTransition(
              opacity: animation,
              child: child,
            );
          },
          transitionDuration: const Duration(milliseconds: 500),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: AppTheme.backgroundGradient,
        ),
        child: SafeArea(
          child: Column(
            children: [
              // Header
              Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  children: [
                    Row(
                      children: [
                        if (_currentStep > 0)
                          IconButton(
                            onPressed: _previousStep,
                            icon: const Icon(Icons.arrow_back_rounded),
                            style: IconButton.styleFrom(
                              backgroundColor: AppTheme.neutral100,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                            ),
                          )
                        else
                          const SizedBox(width: 48),
                        Expanded(
                          child: Center(
                            child: Text(
                              _stepTitles[_currentStep],
                              style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w700,
                                color: AppTheme.neutral800,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 48),
                      ],
                    ),
                    const SizedBox(height: 16),
                    // Progress Bar
                    AnimatedBuilder(
                      animation: _progressController,
                      builder: (context, child) {
                        return Container(
                          height: 6,
                          decoration: BoxDecoration(
                            color: AppTheme.neutral200,
                            borderRadius: BorderRadius.circular(3),
                          ),
                          child: FractionallySizedBox(
                            alignment: Alignment.centerLeft,
                            widthFactor: _progressAnimation.value,
                            child: Container(
                              decoration: BoxDecoration(
                                gradient: AppTheme.primaryGradient,
                                borderRadius: BorderRadius.circular(3),
                              ),
                            ),
                          ),
                        );
                      },
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Step ${_currentStep + 1} of $_totalSteps',
                      style: const TextStyle(
                        fontSize: 14,
                        color: AppTheme.neutral500,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),

              // Content
              Expanded(
                child: PageView(
                  controller: _pageController,
                  physics: const NeverScrollableScrollPhysics(),
                  children: [
                    _buildBasicsStep(),
                    _buildMeasurementsStep(),
                    _buildRegionStep(),
                    _buildInterestsStep(),
                    _buildFavoritesStep(),
                  ],
                ),
              ),

              // Bottom Button
              Padding(
                padding: const EdgeInsets.all(20),
                child: SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _nextStep,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primaryGreen,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 18),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                      elevation: 0,
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          _currentStep < _totalSteps - 1 ? 'Continue' : 'Create Profile',
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Icon(
                          _currentStep < _totalSteps - 1
                              ? Icons.arrow_forward_rounded
                              : Icons.check_rounded,
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  final List<String> _stepTitles = [
    'Basic Info',
    'Measurements',
    'Your Region',
    'Interests',
    'Favorites',
  ];

  Widget _buildBasicsStep() {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 20),
          _buildSectionTitle('What\'s your little one\'s name?'),
          const SizedBox(height: 16),
          _buildTextField(
            controller: _nameController,
            hint: 'Full name',
            icon: Icons.person_rounded,
          ),
          const SizedBox(height: 12),
          _buildTextField(
            controller: _nicknameController,
            hint: 'Nickname (optional)',
            icon: Icons.favorite_rounded,
          ),
          const SizedBox(height: 32),
          _buildSectionTitle('When were they born?'),
          const SizedBox(height: 16),
          _buildDatePicker(),
          const SizedBox(height: 32),
          _buildSectionTitle('Gender'),
          const SizedBox(height: 16),
          _buildGenderSelector(),
        ],
      ),
    );
  }

  Widget _buildMeasurementsStep() {
    final ageMonths = _dateOfBirth != null
        ? DateTime.now().difference(_dateOfBirth!).inDays ~/ 30
        : 0;

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 20),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppTheme.primaryGreen.withOpacity(0.1),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Row(
              children: [
                const Icon(
                  Icons.info_outline_rounded,
                  color: AppTheme.primaryGreen,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'These measurements help us provide accurate WHO growth percentile tracking.',
                    style: TextStyle(
                      color: AppTheme.primaryGreen.withOpacity(0.9),
                      fontSize: 14,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          _buildSectionTitle('Weight'),
          const SizedBox(height: 12),
          _buildTextField(
            controller: _weightController,
            hint: 'Weight in kg',
            icon: Icons.monitor_weight_rounded,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            suffix: 'kg',
          ),
          const SizedBox(height: 24),
          _buildSectionTitle('Height'),
          const SizedBox(height: 12),
          _buildTextField(
            controller: _heightController,
            hint: 'Height in cm',
            icon: Icons.height_rounded,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            suffix: 'cm',
          ),
          if (ageMonths < 36) ...[
            const SizedBox(height: 24),
            _buildSectionTitle('Head Circumference (for babies under 3)'),
            const SizedBox(height: 12),
            _buildTextField(
              controller: _headCircController,
              hint: 'Head circumference in cm (optional)',
              icon: Icons.child_care_rounded,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              suffix: 'cm',
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildRegionStep() {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 20),
          _buildSectionTitle('Select your WHO region'),
          const SizedBox(height: 8),
          Text(
            'This helps us provide region-specific health resources and recommendations.',
            style: TextStyle(
              color: AppTheme.neutral500,
              fontSize: 14,
            ),
          ),
          const SizedBox(height: 24),
          ...WHORegion.values.map((region) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: _buildRegionCard(region),
            );
          }),
        ],
      ),
    );
  }

  Widget _buildInterestsStep() {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 20),
          _buildSectionTitle('What does ${_nameController.text.isEmpty ? "your child" : _nameController.text} love?'),
          const SizedBox(height: 8),
          Text(
            'Select interests to personalize stories, activities, and recommendations.',
            style: TextStyle(
              color: AppTheme.neutral500,
              fontSize: 14,
            ),
          ),
          const SizedBox(height: 24),
          ...InterestData.categories.map((category) {
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(category.emoji, style: const TextStyle(fontSize: 20)),
                    const SizedBox(width: 8),
                    Text(
                      category.name,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.neutral700,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: category.interests.map((interest) {
                    final isSelected = _selectedInterests.contains(interest.id);
                    return _buildChip(
                      label: '${interest.emoji} ${interest.name}',
                      isSelected: isSelected,
                      onTap: () {
                        setState(() {
                          if (isSelected) {
                            _selectedInterests.remove(interest.id);
                          } else {
                            _selectedInterests.add(interest.id);
                          }
                        });
                      },
                    );
                  }).toList(),
                ),
                const SizedBox(height: 20),
              ],
            );
          }),
        ],
      ),
    );
  }

  Widget _buildFavoritesStep() {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 20),
          _buildSectionTitle('Favorite Colors'),
          const SizedBox(height: 12),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: FavoriteColor.colors.map((color) {
              final isSelected = _favoriteColors.contains(color.id);
              return GestureDetector(
                onTap: () {
                  setState(() {
                    if (isSelected) {
                      _favoriteColors.remove(color.id);
                    } else {
                      _favoriteColors.add(color.id);
                    }
                  });
                },
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  width: 56,
                  height: 56,
                  decoration: BoxDecoration(
                    color: Color(int.parse(color.hexCode.replaceFirst('#', '0xFF'))),
                    borderRadius: BorderRadius.circular(16),
                    border: isSelected
                        ? Border.all(color: AppTheme.neutral900, width: 3)
                        : null,
                    boxShadow: isSelected ? AppTheme.mediumShadow : AppTheme.softShadow,
                  ),
                  child: isSelected
                      ? const Icon(Icons.check_rounded, color: Colors.white)
                      : null,
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 32),
          _buildSectionTitle('Favorite Characters'),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: FavoriteCharacter.popularCharacters.map((character) {
              final isSelected = _favoriteCharacters.contains(character.id);
              return _buildChip(
                label: character.name,
                isSelected: isSelected,
                onTap: () {
                  setState(() {
                    if (isSelected) {
                      _favoriteCharacters.remove(character.id);
                    } else {
                      _favoriteCharacters.add(character.id);
                    }
                  });
                },
              );
            }).toList(),
          ),
          const SizedBox(height: 40),
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  AppTheme.primaryGreen.withOpacity(0.1),
                  AppTheme.primaryTeal.withOpacity(0.1),
                ],
              ),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Column(
              children: [
                const Text(
                  '🎉',
                  style: TextStyle(fontSize: 48),
                ),
                const SizedBox(height: 12),
                Text(
                  'Almost done!',
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.neutral800,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'We\'ll use this information to personalize ${_nameController.text}\'s experience.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 14,
                    color: AppTheme.neutral600,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: const TextStyle(
        fontSize: 18,
        fontWeight: FontWeight.w700,
        color: AppTheme.neutral800,
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String hint,
    required IconData icon,
    TextInputType? keyboardType,
    String? suffix,
  }) {
    return TextField(
      controller: controller,
      keyboardType: keyboardType,
      style: const TextStyle(
        fontSize: 16,
        fontWeight: FontWeight.w500,
      ),
      decoration: InputDecoration(
        hintText: hint,
        prefixIcon: Icon(icon, color: AppTheme.neutral400),
        suffixText: suffix,
        suffixStyle: const TextStyle(
          color: AppTheme.neutral500,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  Widget _buildDatePicker() {
    return GestureDetector(
      onTap: () async {
        final date = await showDatePicker(
          context: context,
          initialDate: _dateOfBirth ?? DateTime.now().subtract(const Duration(days: 365)),
          firstDate: DateTime.now().subtract(const Duration(days: 365 * 6)),
          lastDate: DateTime.now(),
          builder: (context, child) {
            return Theme(
              data: Theme.of(context).copyWith(
                colorScheme: const ColorScheme.light(
                  primary: AppTheme.primaryGreen,
                ),
              ),
              child: child!,
            );
          },
        );
        if (date != null) {
          setState(() => _dateOfBirth = date);
        }
      },
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppTheme.neutral100,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          children: [
            const Icon(Icons.calendar_today_rounded, color: AppTheme.neutral400),
            const SizedBox(width: 12),
            Text(
              _dateOfBirth != null
                  ? '${_dateOfBirth!.day}/${_dateOfBirth!.month}/${_dateOfBirth!.year}'
                  : 'Select date of birth',
              style: TextStyle(
                fontSize: 16,
                color: _dateOfBirth != null ? AppTheme.neutral800 : AppTheme.neutral400,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildGenderSelector() {
    return Row(
      children: Gender.values.map((gender) {
        final isSelected = _gender == gender;
        return Expanded(
          child: Padding(
            padding: EdgeInsets.only(
              right: gender != Gender.values.last ? 12 : 0,
            ),
            child: GestureDetector(
              onTap: () => setState(() => _gender = gender),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                padding: const EdgeInsets.symmetric(vertical: 16),
                decoration: BoxDecoration(
                  color: isSelected
                      ? AppTheme.primaryGreen.withOpacity(0.1)
                      : AppTheme.neutral100,
                  borderRadius: BorderRadius.circular(16),
                  border: isSelected
                      ? Border.all(color: AppTheme.primaryGreen, width: 2)
                      : null,
                ),
                child: Column(
                  children: [
                    Text(
                      gender == Gender.male ? '👦' : gender == Gender.female ? '👧' : '🧒',
                      style: const TextStyle(fontSize: 32),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      gender.name[0].toUpperCase() + gender.name.substring(1),
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: isSelected ? AppTheme.primaryGreen : AppTheme.neutral600,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildRegionCard(WHORegion region) {
    final isSelected = _region == region;
    final regionData = _regionInfo[region]!;

    return GestureDetector(
      onTap: () => setState(() => _region = region),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isSelected
              ? AppTheme.primaryGreen.withOpacity(0.1)
              : Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: isSelected
              ? Border.all(color: AppTheme.primaryGreen, width: 2)
              : Border.all(color: AppTheme.neutral200),
          boxShadow: isSelected ? AppTheme.softShadow : null,
        ),
        child: Row(
          children: [
            Text(
              regionData['emoji']!,
              style: const TextStyle(fontSize: 32),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    regionData['name']!,
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: isSelected ? AppTheme.primaryGreen : AppTheme.neutral800,
                    ),
                  ),
                  Text(
                    regionData['description']!,
                    style: const TextStyle(
                      fontSize: 13,
                      color: AppTheme.neutral500,
                    ),
                  ),
                ],
              ),
            ),
            if (isSelected)
              const Icon(Icons.check_circle_rounded, color: AppTheme.primaryGreen),
          ],
        ),
      ),
    );
  }

  Widget _buildChip({
    required String label,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: isSelected
              ? AppTheme.primaryGreen.withOpacity(0.15)
              : AppTheme.neutral100,
          borderRadius: BorderRadius.circular(20),
          border: isSelected
              ? Border.all(color: AppTheme.primaryGreen, width: 2)
              : null,
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: isSelected ? AppTheme.primaryGreen : AppTheme.neutral600,
          ),
        ),
      ),
    );
  }

  final Map<WHORegion, Map<String, String>> _regionInfo = {
    WHORegion.afro: {
      'emoji': '🌍',
      'name': 'African Region',
      'description': 'Countries in Africa',
    },
    WHORegion.amro: {
      'emoji': '🌎',
      'name': 'Americas',
      'description': 'North, Central, South America & Caribbean',
    },
    WHORegion.searo: {
      'emoji': '🌏',
      'name': 'South-East Asia',
      'description': 'India, Indonesia, Thailand & more',
    },
    WHORegion.euro: {
      'emoji': '🇪🇺',
      'name': 'European Region',
      'description': 'Europe & Central Asia',
    },
    WHORegion.emro: {
      'emoji': '🕌',
      'name': 'Eastern Mediterranean',
      'description': 'Middle East & North Africa',
    },
    WHORegion.wpro: {
      'emoji': '🏯',
      'name': 'Western Pacific',
      'description': 'China, Japan, Australia & Pacific Islands',
    },
  };
}
