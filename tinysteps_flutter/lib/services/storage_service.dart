import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/models.dart';

/// Local storage service for persisting app data
class StorageService {
  static const String _childrenKey = 'children';
  static const String _analysesKey = 'analyses';
  static const String _storiesKey = 'stories';
  static const String _timelineKey = 'timeline';
  static const String _measurementsKey = 'measurements';
  static const String _preferencesKey = 'preferences';
  static const String _apiKeyKey = 'gemini_api_key';
  static const String _onboardingKey = 'onboarding_complete';
  static const String _currentChildKey = 'current_child_id';

  late SharedPreferences _prefs;
  bool _isInitialized = false;

  static final StorageService _instance = StorageService._internal();
  factory StorageService() => _instance;
  StorageService._internal();

  /// Initialize the storage service
  Future<void> initialize() async {
    _prefs = await SharedPreferences.getInstance();
    _isInitialized = true;
  }

  bool get isInitialized => _isInitialized;

  // API Key Management
  Future<void> saveApiKey(String apiKey) async {
    await _prefs.setString(_apiKeyKey, apiKey);
  }

  String? getApiKey() {
    return _prefs.getString(_apiKeyKey);
  }

  // Onboarding State
  Future<void> setOnboardingComplete(bool complete) async {
    await _prefs.setBool(_onboardingKey, complete);
  }

  bool isOnboardingComplete() {
    return _prefs.getBool(_onboardingKey) ?? false;
  }

  // Current Child Management
  Future<void> setCurrentChildId(String childId) async {
    await _prefs.setString(_currentChildKey, childId);
  }

  String? getCurrentChildId() {
    return _prefs.getString(_currentChildKey);
  }

  // Children CRUD
  Future<void> saveChild(ChildProfile child) async {
    final children = await getChildren();
    final index = children.indexWhere((c) => c.id == child.id);
    if (index >= 0) {
      children[index] = child;
    } else {
      children.add(child);
    }
    await _saveChildren(children);
  }

  Future<List<ChildProfile>> getChildren() async {
    final jsonStr = _prefs.getString(_childrenKey);
    if (jsonStr == null) return [];

    final List<dynamic> jsonList = json.decode(jsonStr);
    return jsonList.map((j) => ChildProfile.fromJson(j)).toList();
  }

  Future<ChildProfile?> getChild(String id) async {
    final children = await getChildren();
    try {
      return children.firstWhere((c) => c.id == id);
    } catch (_) {
      return null;
    }
  }

  Future<ChildProfile?> getCurrentChild() async {
    final id = getCurrentChildId();
    if (id == null) return null;
    return getChild(id);
  }

  Future<void> deleteChild(String id) async {
    final children = await getChildren();
    children.removeWhere((c) => c.id == id);
    await _saveChildren(children);

    // Also clean up related data
    await _deleteChildAnalyses(id);
    await _deleteChildStories(id);
    await _deleteChildTimeline(id);
  }

  Future<void> _saveChildren(List<ChildProfile> children) async {
    final jsonList = children.map((c) => c.toJson()).toList();
    await _prefs.setString(_childrenKey, json.encode(jsonList));
  }

  // Analysis Results CRUD
  Future<void> saveAnalysis(AnalysisResult analysis) async {
    final analyses = await getAnalyses(analysis.childId);
    analyses.insert(0, analysis); // Add to beginning
    await _saveAnalyses(analysis.childId, analyses);
  }

  Future<List<AnalysisResult>> getAnalyses(String childId) async {
    final jsonStr = _prefs.getString('${_analysesKey}_$childId');
    if (jsonStr == null) return [];

    final List<dynamic> jsonList = json.decode(jsonStr);
    return jsonList.map((j) => AnalysisResult.fromJson(j)).toList();
  }

  Future<AnalysisResult?> getLatestAnalysis(String childId) async {
    final analyses = await getAnalyses(childId);
    return analyses.isNotEmpty ? analyses.first : null;
  }

  Future<void> _saveAnalyses(String childId, List<AnalysisResult> analyses) async {
    final jsonList = analyses.map((a) => a.toJson()).toList();
    await _prefs.setString('${_analysesKey}_$childId', json.encode(jsonList));
  }

  Future<void> _deleteChildAnalyses(String childId) async {
    await _prefs.remove('${_analysesKey}_$childId');
  }

  // Bedtime Stories CRUD
  Future<void> saveStory(BedtimeStory story) async {
    final stories = await getStories(story.childId);
    final index = stories.indexWhere((s) => s.id == story.id);
    if (index >= 0) {
      stories[index] = story;
    } else {
      stories.insert(0, story);
    }
    await _saveStories(story.childId, stories);
  }

  Future<List<BedtimeStory>> getStories(String childId) async {
    final jsonStr = _prefs.getString('${_storiesKey}_$childId');
    if (jsonStr == null) return [];

    final List<dynamic> jsonList = json.decode(jsonStr);
    return jsonList.map((j) => BedtimeStory.fromJson(j)).toList();
  }

  Future<void> deleteStory(String childId, String storyId) async {
    final stories = await getStories(childId);
    stories.removeWhere((s) => s.id == storyId);
    await _saveStories(childId, stories);
  }

  Future<void> _saveStories(String childId, List<BedtimeStory> stories) async {
    final jsonList = stories.map((s) => s.toJson()).toList();
    await _prefs.setString('${_storiesKey}_$childId', json.encode(jsonList));
  }

  Future<void> _deleteChildStories(String childId) async {
    await _prefs.remove('${_storiesKey}_$childId');
  }

  // Timeline Entries CRUD
  Future<void> saveTimelineEntry(TimelineEntry entry) async {
    final entries = await getTimelineEntries(entry.childId);
    final index = entries.indexWhere((e) => e.id == entry.id);
    if (index >= 0) {
      entries[index] = entry;
    } else {
      entries.insert(0, entry);
    }
    // Sort by date descending
    entries.sort((a, b) => b.date.compareTo(a.date));
    await _saveTimelineEntries(entry.childId, entries);
  }

  Future<List<TimelineEntry>> getTimelineEntries(String childId) async {
    final jsonStr = _prefs.getString('${_timelineKey}_$childId');
    if (jsonStr == null) return [];

    final List<dynamic> jsonList = json.decode(jsonStr);
    return jsonList.map((j) => TimelineEntry.fromJson(j)).toList();
  }

  Future<void> deleteTimelineEntry(String childId, String entryId) async {
    final entries = await getTimelineEntries(childId);
    entries.removeWhere((e) => e.id == entryId);
    await _saveTimelineEntries(childId, entries);
  }

  Future<void> _saveTimelineEntries(String childId, List<TimelineEntry> entries) async {
    final jsonList = entries.map((e) => e.toJson()).toList();
    await _prefs.setString('${_timelineKey}_$childId', json.encode(jsonList));
  }

  Future<void> _deleteChildTimeline(String childId) async {
    await _prefs.remove('${_timelineKey}_$childId');
  }

  // Growth Measurements CRUD
  Future<void> saveMeasurement(GrowthMeasurement measurement) async {
    final measurements = await getMeasurements(measurement.childId);
    final index = measurements.indexWhere((m) => m.id == measurement.id);
    if (index >= 0) {
      measurements[index] = measurement;
    } else {
      measurements.add(measurement);
    }
    // Sort by date
    measurements.sort((a, b) => a.date.compareTo(b.date));
    await _saveMeasurements(measurement.childId, measurements);
  }

  Future<List<GrowthMeasurement>> getMeasurements(String childId) async {
    final jsonStr = _prefs.getString('${_measurementsKey}_$childId');
    if (jsonStr == null) return [];

    final List<dynamic> jsonList = json.decode(jsonStr);
    return jsonList.map((j) => GrowthMeasurement.fromJson(j)).toList();
  }

  Future<void> _saveMeasurements(String childId, List<GrowthMeasurement> measurements) async {
    final jsonList = measurements.map((m) => m.toJson()).toList();
    await _prefs.setString('${_measurementsKey}_$childId', json.encode(jsonList));
  }

  // App Preferences
  Future<void> savePreference(String key, dynamic value) async {
    final prefs = await getPreferences();
    prefs[key] = value;
    await _prefs.setString(_preferencesKey, json.encode(prefs));
  }

  Future<Map<String, dynamic>> getPreferences() async {
    final jsonStr = _prefs.getString(_preferencesKey);
    if (jsonStr == null) return {};
    return json.decode(jsonStr);
  }

  Future<T?> getPreference<T>(String key) async {
    final prefs = await getPreferences();
    return prefs[key] as T?;
  }

  // Clear all data
  Future<void> clearAllData() async {
    await _prefs.clear();
  }
}
