import 'dart:io';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import '../../models/models.dart';
import '../../models/interests.dart';
import '../../services/storage_service.dart';
import '../../services/api_service.dart';
import '../../utils/app_theme.dart';

class EditProfileScreen extends StatefulWidget {
  final ChildProfile child;
  final Function(ChildProfile)? onSave;

  const EditProfileScreen({
    super.key,
    required this.child,
    this.onSave,
  });

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final _formKey = GlobalKey<FormState>();
  final _imagePicker = ImagePicker();

  // Form controllers
  late TextEditingController _nameController;
  late TextEditingController _nicknameController;
  late TextEditingController _weightController;
  late TextEditingController _heightController;
  late TextEditingController _headCircumferenceController;
  late TextEditingController _toyController;

  // Form state
  File? _selectedPhoto;
  String? _photoBase64;
  late DateTime _dateOfBirth;
  late Gender _gender;
  late WHORegion _region;
  late List<String> _interests;
  late List<String> _favoriteCharacters;
  late List<String> _favoriteColors;
  late List<String> _favoriteToys;

  bool _isSaving = false;
  bool _hasChanges = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 5, vsync: this);

    // Initialize controllers with current values
    _nameController = TextEditingController(text: widget.child.name);
    _nicknameController = TextEditingController(text: widget.child.nickname ?? '');
    _weightController = TextEditingController(text: widget.child.weight.toString());
    _heightController = TextEditingController(text: widget.child.height.toString());
    _headCircumferenceController = TextEditingController(
      text: widget.child.headCircumference?.toString() ?? '',
    );
    _toyController = TextEditingController();

    // Initialize state
    _dateOfBirth = widget.child.dateOfBirth;
    _gender = widget.child.gender;
    _region = widget.child.region;
    _interests = List.from(widget.child.interests);
    _favoriteCharacters = List.from(widget.child.favoriteCharacters);
    _favoriteColors = List.from(widget.child.favoriteColors);
    _favoriteToys = List.from(widget.child.favoriteToys);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _nameController.dispose();
    _nicknameController.dispose();
    _weightController.dispose();
    _heightController.dispose();
    _headCircumferenceController.dispose();
    _toyController.dispose();
    super.dispose();
  }

  void _markChanged() {
    if (!_hasChanges) {
      setState(() => _hasChanges = true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.neutral50,
      appBar: AppBar(
        title: const Text('Edit Profile'),
        backgroundColor: Colors.white,
        foregroundColor: AppTheme.neutral900,
        elevation: 0,
        actions: [
          if (_hasChanges)
            TextButton(
              onPressed: _isSaving ? null : _saveProfile,
              child: _isSaving
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Text('Save'),
            ),
        ],
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          labelColor: AppTheme.primaryGreen,
          unselectedLabelColor: AppTheme.neutral500,
          indicatorColor: AppTheme.primaryGreen,
          tabs: const [
            Tab(icon: Icon(Icons.photo_camera), text: 'Photo'),
            Tab(icon: Icon(Icons.person), text: 'Basics'),
            Tab(icon: Icon(Icons.straighten), text: 'Measurements'),
            Tab(icon: Icon(Icons.favorite), text: 'Interests'),
            Tab(icon: Icon(Icons.star), text: 'Favorites'),
          ],
        ),
      ),
      body: Form(
        key: _formKey,
        child: TabBarView(
          controller: _tabController,
          children: [
            _buildPhotoTab(),
            _buildBasicsTab(),
            _buildMeasurementsTab(),
            _buildInterestsTab(),
            _buildFavoritesTab(),
          ],
        ),
      ),
    );
  }

  Widget _buildPhotoTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          const SizedBox(height: 40),
          GestureDetector(
            onTap: _pickImage,
            child: Container(
              width: 200,
              height: 200,
              decoration: BoxDecoration(
                color: AppTheme.neutral100,
                borderRadius: BorderRadius.circular(100),
                border: Border.all(
                  color: AppTheme.primaryGreen.withOpacity(0.3),
                  width: 4,
                ),
                image: _getProfileImage(),
              ),
              child: _selectedPhoto == null && widget.child.profilePhotoPath == null
                  ? Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.add_a_photo_rounded,
                          size: 48,
                          color: AppTheme.neutral400,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Add Photo',
                          style: TextStyle(
                            color: AppTheme.neutral500,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    )
                  : null,
            ),
          ),
          const SizedBox(height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              ElevatedButton.icon(
                onPressed: _pickImage,
                icon: const Icon(Icons.photo_library),
                label: const Text('Choose Photo'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primaryGreen,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                ),
              ),
              if (_selectedPhoto != null || widget.child.profilePhotoPath != null) ...[
                const SizedBox(width: 12),
                OutlinedButton.icon(
                  onPressed: _removePhoto,
                  icon: const Icon(Icons.delete_outline),
                  label: const Text('Remove'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppTheme.error,
                  ),
                ),
              ],
            ],
          ),
          const SizedBox(height: 32),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppTheme.secondaryBlue.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                Icon(Icons.info_outline, color: AppTheme.secondaryBlue),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'The photo will be used to personalize story illustrations and make the app more engaging for your child.',
                    style: TextStyle(
                      fontSize: 13,
                      color: AppTheme.neutral700,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBasicsTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildTextField(
            controller: _nameController,
            label: 'Name',
            hint: 'Enter child\'s name',
            validator: (value) {
              if (value == null || value.isEmpty) {
                return 'Name is required';
              }
              return null;
            },
          ),
          const SizedBox(height: 20),
          _buildTextField(
            controller: _nicknameController,
            label: 'Nickname (optional)',
            hint: 'Enter nickname',
          ),
          const SizedBox(height: 20),
          _buildDatePicker(),
          const SizedBox(height: 20),
          _buildGenderSelector(),
          const SizedBox(height: 20),
          _buildRegionSelector(),
          const SizedBox(height: 40),
          _buildDeleteProfileButton(),
        ],
      ),
    );
  }

  Widget _buildMeasurementsTab() {
    final ageInMonths = widget.child.ageInMonths;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: AppTheme.primaryGradient,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(
                    Icons.straighten_rounded,
                    color: Colors.white,
                    size: 28,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Growth Tracking',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                      Text(
                        'Based on WHO growth standards',
                        style: TextStyle(
                          fontSize: 13,
                          color: Colors.white.withOpacity(0.8),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          _buildMeasurementField(
            controller: _weightController,
            label: 'Weight',
            unit: 'kg',
            icon: Icons.monitor_weight_rounded,
            validator: (value) {
              if (value == null || value.isEmpty) {
                return 'Weight is required';
              }
              final weight = double.tryParse(value);
              if (weight == null || weight <= 0 || weight > 100) {
                return 'Enter a valid weight';
              }
              return null;
            },
          ),
          const SizedBox(height: 20),
          _buildMeasurementField(
            controller: _heightController,
            label: 'Height',
            unit: 'cm',
            icon: Icons.height_rounded,
            validator: (value) {
              if (value == null || value.isEmpty) {
                return 'Height is required';
              }
              final height = double.tryParse(value);
              if (height == null || height <= 0 || height > 200) {
                return 'Enter a valid height';
              }
              return null;
            },
          ),
          if (ageInMonths < 36) ...[
            const SizedBox(height: 20),
            _buildMeasurementField(
              controller: _headCircumferenceController,
              label: 'Head Circumference',
              unit: 'cm',
              icon: Icons.face_rounded,
              hint: 'Optional for children under 3',
            ),
          ],
          const SizedBox(height: 24),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppTheme.warning.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                Icon(Icons.tips_and_updates, color: AppTheme.warning),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'Tip: Update measurements monthly for accurate growth tracking.',
                    style: TextStyle(
                      fontSize: 13,
                      color: AppTheme.neutral700,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInterestsTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'What does ${widget.child.name} love?',
            style: const TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: AppTheme.neutral900,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Select interests to personalize stories and activities',
            style: TextStyle(
              fontSize: 14,
              color: AppTheme.neutral500,
            ),
          ),
          const SizedBox(height: 24),
          ...InterestData.categories.map((category) => _buildInterestCategory(category)),
        ],
      ),
    );
  }

  Widget _buildInterestCategory(InterestCategory category) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 12),
          child: Row(
            children: [
              Text(
                category.emoji,
                style: const TextStyle(fontSize: 24),
              ),
              const SizedBox(width: 8),
              Text(
                category.name,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.neutral800,
                ),
              ),
            ],
          ),
        ),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: category.interests.map((interest) {
            final isSelected = _interests.contains(interest.id);
            return FilterChip(
              label: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(interest.emoji),
                  const SizedBox(width: 6),
                  Text(interest.name),
                ],
              ),
              selected: isSelected,
              onSelected: (selected) {
                setState(() {
                  if (selected) {
                    _interests.add(interest.id);
                  } else {
                    _interests.remove(interest.id);
                  }
                });
                _markChanged();
              },
              selectedColor: AppTheme.primaryGreen.withOpacity(0.2),
              checkmarkColor: AppTheme.primaryGreen,
              backgroundColor: AppTheme.neutral100,
              side: BorderSide(
                color: isSelected ? AppTheme.primaryGreen : AppTheme.neutral200,
              ),
            );
          }).toList(),
        ),
        const SizedBox(height: 8),
      ],
    );
  }

  Widget _buildFavoritesTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildFavoriteCharactersSection(),
          const SizedBox(height: 32),
          _buildFavoriteColorsSection(),
          const SizedBox(height: 32),
          _buildFavoriteToysSection(),
        ],
      ),
    );
  }

  Widget _buildFavoriteCharactersSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Row(
          children: [
            Text('🎬', style: TextStyle(fontSize: 24)),
            SizedBox(width: 8),
            Text(
              'Favorite Characters',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppTheme.neutral900,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Text(
          'Characters will appear in personalized stories',
          style: TextStyle(fontSize: 13, color: AppTheme.neutral500),
        ),
        const SizedBox(height: 16),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: FavoriteCharacter.popularCharacters.map((character) {
            final isSelected = _favoriteCharacters.contains(character.id);
            return FilterChip(
              label: Text(character.name),
              selected: isSelected,
              onSelected: (selected) {
                setState(() {
                  if (selected) {
                    _favoriteCharacters.add(character.id);
                  } else {
                    _favoriteCharacters.remove(character.id);
                  }
                });
                _markChanged();
              },
              selectedColor: AppTheme.secondaryOrange.withOpacity(0.2),
              checkmarkColor: AppTheme.secondaryOrange,
              backgroundColor: AppTheme.neutral100,
              side: BorderSide(
                color: isSelected ? AppTheme.secondaryOrange : AppTheme.neutral200,
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildFavoriteColorsSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Row(
          children: [
            Text('🎨', style: TextStyle(fontSize: 24)),
            SizedBox(width: 8),
            Text(
              'Favorite Colors',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppTheme.neutral900,
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        Wrap(
          spacing: 12,
          runSpacing: 12,
          children: FavoriteColor.colors.map((color) {
            final isSelected = _favoriteColors.contains(color.id);
            final colorValue = Color(
              int.parse(color.hexCode.replaceFirst('#', '0xFF')),
            );
            return GestureDetector(
              onTap: () {
                setState(() {
                  if (isSelected) {
                    _favoriteColors.remove(color.id);
                  } else {
                    _favoriteColors.add(color.id);
                  }
                });
                _markChanged();
              },
              child: Container(
                width: 60,
                height: 60,
                decoration: BoxDecoration(
                  color: colorValue,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: isSelected ? AppTheme.neutral900 : Colors.transparent,
                    width: 3,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: colorValue.withOpacity(0.4),
                      blurRadius: 8,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: isSelected
                    ? Icon(
                        Icons.check,
                        color: _isLightColor(colorValue) ? Colors.black : Colors.white,
                      )
                    : null,
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildFavoriteToysSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Row(
          children: [
            Text('🧸', style: TextStyle(fontSize: 24)),
            SizedBox(width: 8),
            Text(
              'Favorite Toys',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppTheme.neutral900,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Text(
          'Add toys that your child loves',
          style: TextStyle(fontSize: 13, color: AppTheme.neutral500),
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: TextField(
                controller: _toyController,
                decoration: InputDecoration(
                  hintText: 'Enter toy name',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                textInputAction: TextInputAction.done,
                onSubmitted: (_) => _addToy(),
              ),
            ),
            const SizedBox(width: 12),
            ElevatedButton(
              onPressed: _addToy,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primaryGreen,
                padding: const EdgeInsets.all(16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: const Icon(Icons.add, color: Colors.white),
            ),
          ],
        ),
        if (_favoriteToys.isNotEmpty) ...[
          const SizedBox(height: 16),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _favoriteToys.map((toy) {
              return Chip(
                label: Text(toy),
                deleteIcon: const Icon(Icons.close, size: 18),
                onDeleted: () {
                  setState(() => _favoriteToys.remove(toy));
                  _markChanged();
                },
                backgroundColor: AppTheme.secondaryPurple.withOpacity(0.1),
                side: BorderSide(color: AppTheme.secondaryPurple.withOpacity(0.3)),
              );
            }).toList(),
          ),
        ],
      ],
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    String? hint,
    String? Function(String?)? validator,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: AppTheme.neutral700,
          ),
        ),
        const SizedBox(height: 8),
        TextFormField(
          controller: controller,
          decoration: InputDecoration(
            hintText: hint,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
          validator: validator,
          onChanged: (_) => _markChanged(),
        ),
      ],
    );
  }

  Widget _buildMeasurementField({
    required TextEditingController controller,
    required String label,
    required String unit,
    required IconData icon,
    String? hint,
    String? Function(String?)? validator,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: AppTheme.softShadow,
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppTheme.primaryGreen.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: AppTheme.primaryGreen),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.neutral700,
                  ),
                ),
                const SizedBox(height: 8),
                TextFormField(
                  controller: controller,
                  keyboardType: TextInputType.number,
                  decoration: InputDecoration(
                    hintText: hint,
                    suffixText: unit,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 8,
                    ),
                  ),
                  validator: validator,
                  onChanged: (_) => _markChanged(),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDatePicker() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Date of Birth',
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: AppTheme.neutral700,
          ),
        ),
        const SizedBox(height: 8),
        InkWell(
          onTap: _selectDate,
          borderRadius: BorderRadius.circular(12),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            decoration: BoxDecoration(
              border: Border.all(color: AppTheme.neutral300),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                Icon(Icons.calendar_today, color: AppTheme.neutral500),
                const SizedBox(width: 12),
                Text(
                  DateFormat('MMMM d, y').format(_dateOfBirth),
                  style: const TextStyle(fontSize: 16),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildGenderSelector() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Gender',
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: AppTheme.neutral700,
          ),
        ),
        const SizedBox(height: 8),
        Row(
          children: Gender.values.map((gender) {
            final isSelected = _gender == gender;
            return Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 4),
                child: ChoiceChip(
                  label: Text(
                    gender.name[0].toUpperCase() + gender.name.substring(1),
                  ),
                  selected: isSelected,
                  onSelected: (_) {
                    setState(() => _gender = gender);
                    _markChanged();
                  },
                  selectedColor: AppTheme.primaryGreen.withOpacity(0.2),
                  backgroundColor: AppTheme.neutral100,
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildRegionSelector() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'WHO Region',
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: AppTheme.neutral700,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          'Used for accurate growth standards',
          style: TextStyle(fontSize: 12, color: AppTheme.neutral500),
        ),
        const SizedBox(height: 8),
        DropdownButtonFormField<WHORegion>(
          value: _region,
          decoration: InputDecoration(
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
          items: WHORegion.values.map((region) {
            return DropdownMenuItem(
              value: region,
              child: Text(_getRegionName(region)),
            );
          }).toList(),
          onChanged: (value) {
            if (value != null) {
              setState(() => _region = value);
              _markChanged();
            }
          },
        ),
      ],
    );
  }

  Widget _buildDeleteProfileButton() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.error.withOpacity(0.05),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.error.withOpacity(0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Danger Zone',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: AppTheme.error,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Deleting this profile will remove all data including analyses, stories, and milestones.',
            style: TextStyle(
              fontSize: 13,
              color: AppTheme.neutral600,
            ),
          ),
          const SizedBox(height: 16),
          ElevatedButton.icon(
            onPressed: _confirmDeleteProfile,
            icon: const Icon(Icons.delete_forever),
            label: const Text('Delete Profile'),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.error,
              foregroundColor: Colors.white,
            ),
          ),
        ],
      ),
    );
  }

  DecorationImage? _getProfileImage() {
    if (_selectedPhoto != null) {
      return DecorationImage(
        image: FileImage(_selectedPhoto!),
        fit: BoxFit.cover,
      );
    }
    if (widget.child.profilePhotoPath != null) {
      return DecorationImage(
        image: FileImage(File(widget.child.profilePhotoPath!)),
        fit: BoxFit.cover,
      );
    }
    return null;
  }

  bool _isLightColor(Color color) {
    return color.computeLuminance() > 0.5;
  }

  String _getRegionName(WHORegion region) {
    switch (region) {
      case WHORegion.afro:
        return 'African Region';
      case WHORegion.amro:
        return 'Americas';
      case WHORegion.searo:
        return 'South-East Asia';
      case WHORegion.euro:
        return 'Europe';
      case WHORegion.emro:
        return 'Eastern Mediterranean';
      case WHORegion.wpro:
        return 'Western Pacific';
    }
  }

  Future<void> _pickImage() async {
    final source = await showModalBottomSheet<ImageSource>(
      context: context,
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.camera_alt),
              title: const Text('Take Photo'),
              onTap: () => Navigator.pop(context, ImageSource.camera),
            ),
            ListTile(
              leading: const Icon(Icons.photo_library),
              title: const Text('Choose from Gallery'),
              onTap: () => Navigator.pop(context, ImageSource.gallery),
            ),
          ],
        ),
      ),
    );

    if (source == null) return;

    final pickedFile = await _imagePicker.pickImage(
      source: source,
      maxWidth: 800,
      maxHeight: 800,
      imageQuality: 85,
    );

    if (pickedFile != null) {
      final bytes = await pickedFile.readAsBytes();
      setState(() {
        _selectedPhoto = File(pickedFile.path);
        _photoBase64 = base64Encode(bytes);
      });
      _markChanged();
    }
  }

  void _removePhoto() {
    setState(() {
      _selectedPhoto = null;
      _photoBase64 = null;
    });
    _markChanged();
  }

  Future<void> _selectDate() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: _dateOfBirth,
      firstDate: DateTime(now.year - 10),
      lastDate: now,
    );

    if (picked != null && picked != _dateOfBirth) {
      setState(() => _dateOfBirth = picked);
      _markChanged();
    }
  }

  void _addToy() {
    final toy = _toyController.text.trim();
    if (toy.isNotEmpty && !_favoriteToys.contains(toy)) {
      setState(() {
        _favoriteToys.add(toy);
        _toyController.clear();
      });
      _markChanged();
    }
  }

  Future<void> _saveProfile() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() => _isSaving = true);

    try {
      final updatedChild = widget.child.copyWith(
        name: _nameController.text.trim(),
        nickname: _nicknameController.text.trim().isEmpty
            ? null
            : _nicknameController.text.trim(),
        dateOfBirth: _dateOfBirth,
        gender: _gender,
        region: _region,
        weight: double.parse(_weightController.text),
        height: double.parse(_heightController.text),
        headCircumference: _headCircumferenceController.text.isEmpty
            ? null
            : double.parse(_headCircumferenceController.text),
        interests: _interests,
        favoriteCharacters: _favoriteCharacters,
        favoriteColors: _favoriteColors,
        favoriteToys: _favoriteToys,
        profilePhotoPath: _selectedPhoto?.path ?? widget.child.profilePhotoPath,
        updatedAt: DateTime.now(),
      );

      // Save locally
      final storage = StorageService();
      await storage.saveChild(updatedChild);

      // Try to sync with backend
      try {
        final api = ApiService();
        await api.updateChild(updatedChild.id, updatedChild);
      } catch (e) {
        // Backend sync failed but local save succeeded
        debugPrint('Backend sync failed: $e');
      }

      if (mounted) {
        widget.onSave?.call(updatedChild);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Profile updated successfully'),
            backgroundColor: AppTheme.success,
          ),
        );
        Navigator.pop(context, updatedChild);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to save: $e'),
            backgroundColor: AppTheme.error,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isSaving = false);
      }
    }
  }

  void _confirmDeleteProfile() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: [
            Icon(Icons.warning_rounded, color: AppTheme.error),
            const SizedBox(width: 8),
            const Text('Delete Profile?'),
          ],
        ),
        content: Text(
          'Are you sure you want to delete ${widget.child.name}\'s profile? '
          'This will permanently remove all their data including analyses, stories, and milestones. '
          'This action cannot be undone.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(context);
              await _deleteProfile();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.error,
              foregroundColor: Colors.white,
            ),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }

  Future<void> _deleteProfile() async {
    setState(() => _isSaving = true);

    try {
      // Try to delete from backend
      try {
        final api = ApiService();
        await api.deleteChild(widget.child.id);
      } catch (e) {
        debugPrint('Backend delete failed: $e');
      }

      // Delete locally
      final storage = StorageService();
      await storage.deleteChild(widget.child.id);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Profile deleted'),
            backgroundColor: AppTheme.success,
          ),
        );
        // Pop back to main screen and signal refresh
        Navigator.of(context).popUntil((route) => route.isFirst);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to delete: $e'),
            backgroundColor: AppTheme.error,
          ),
        );
        setState(() => _isSaving = false);
      }
    }
  }
}
