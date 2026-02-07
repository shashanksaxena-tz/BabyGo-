import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import '../config/api_config.dart';
import '../models/models.dart';

/// API Service for connecting to TinySteps AI backend
class ApiService {
  // Use environment variable or fallback to config
  static String get _baseUrl => const String.fromEnvironment(
    'API_URL',
    defaultValue: '',
  ).isNotEmpty
    ? const String.fromEnvironment('API_URL')
    : ApiConfig.apiUrl;

  String? _token;
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  /// Set authentication token
  void setToken(String token) {
    _token = token;
  }

  /// Clear authentication token
  void clearToken() {
    _token = null;
  }

  /// Check if user is authenticated
  bool get isAuthenticated => _token != null;

  /// Get headers for requests
  Map<String, String> get _headers {
    final headers = <String, String>{
      'Content-Type': 'application/json',
    };
    if (_token != null) {
      headers['Authorization'] = 'Bearer $_token';
    }
    return headers;
  }

  /// Generic request handler
  Future<Map<String, dynamic>> _request(
    String method,
    String endpoint, {
    Map<String, dynamic>? body,
    Map<String, String>? queryParams,
  }) async {
    try {
      Uri uri = Uri.parse('$_baseUrl$endpoint');
      if (queryParams != null) {
        uri = uri.replace(queryParameters: queryParams);
      }

      http.Response response;
      switch (method) {
        case 'GET':
          response = await http.get(uri, headers: _headers);
          break;
        case 'POST':
          response = await http.post(
            uri,
            headers: _headers,
            body: body != null ? json.encode(body) : null,
          );
          break;
        case 'PUT':
          response = await http.put(
            uri,
            headers: _headers,
            body: body != null ? json.encode(body) : null,
          );
          break;
        case 'PATCH':
          response = await http.patch(
            uri,
            headers: _headers,
            body: body != null ? json.encode(body) : null,
          );
          break;
        case 'DELETE':
          response = await http.delete(uri, headers: _headers);
          break;
        default:
          throw Exception('Unsupported HTTP method: $method');
      }

      final data = json.decode(response.body);

      if (response.statusCode >= 200 && response.statusCode < 300) {
        return {'success': true, 'data': data};
      } else {
        return {
          'success': false,
          'error': data['error'] ?? 'Request failed',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'error': 'Network error: ${e.toString()}',
      };
    }
  }

  // ==================== Auth ====================

  /// Register a new user
  Future<Map<String, dynamic>> register({
    required String email,
    required String password,
    required String name,
  }) async {
    return _request('POST', '/auth/register', body: {
      'email': email,
      'password': password,
      'name': name,
    });
  }

  /// Login user
  Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) async {
    final result = await _request('POST', '/auth/login', body: {
      'email': email,
      'password': password,
    });

    if (result['success'] == true && result['data']?['token'] != null) {
      setToken(result['data']['token']);
    }

    return result;
  }

  /// Get current user profile
  Future<Map<String, dynamic>> getProfile() async {
    return _request('GET', '/auth/me');
  }

  /// Update API key
  Future<Map<String, dynamic>> updateApiKey(String apiKey) async {
    return _request('PUT', '/auth/api-key', body: {'apiKey': apiKey});
  }

  /// Logout
  void logout() {
    clearToken();
  }

  // ==================== Children ====================

  /// Get all children for current user
  Future<Map<String, dynamic>> getChildren() async {
    return _request('GET', '/children');
  }

  /// Create a new child profile
  Future<Map<String, dynamic>> createChild(ChildProfile child) async {
    return _request('POST', '/children', body: {
      'name': child.name,
      'birthDate': child.birthDate.toIso8601String(),
      'gender': child.gender.name,
      'weight': child.weight,
      'height': child.height,
      'headCircumference': child.headCircumference,
      'region': child.region.name,
      'interests': child.interests,
      'favoriteCharacters': child.favoriteCharacters,
      'photoUrl': child.photoUrl,
    });
  }

  /// Get a specific child
  Future<Map<String, dynamic>> getChild(String childId) async {
    return _request('GET', '/children/$childId');
  }

  /// Update a child profile
  Future<Map<String, dynamic>> updateChild(String childId, ChildProfile child) async {
    return _request('PUT', '/children/$childId', body: {
      'name': child.name,
      'birthDate': child.birthDate.toIso8601String(),
      'gender': child.gender.name,
      'weight': child.weight,
      'height': child.height,
      'headCircumference': child.headCircumference,
      'region': child.region.name,
      'interests': child.interests,
      'favoriteCharacters': child.favoriteCharacters,
      'photoUrl': child.photoUrl,
    });
  }

  /// Delete a child
  Future<Map<String, dynamic>> deleteChild(String childId) async {
    return _request('DELETE', '/children/$childId');
  }

  // ==================== Analysis ====================

  /// Create a new analysis with media files
  Future<Map<String, dynamic>> createAnalysis({
    required String childId,
    required List<File> mediaFiles,
    File? audioFile,
  }) async {
    try {
      final uri = Uri.parse('$_baseUrl/analysis');
      final request = http.MultipartRequest('POST', uri);

      // Add auth header
      if (_token != null) {
        request.headers['Authorization'] = 'Bearer $_token';
      }

      // Add child ID
      request.fields['childId'] = childId;

      // Add media files
      for (int i = 0; i < mediaFiles.length; i++) {
        final file = mediaFiles[i];
        final mimeType = _getMimeType(file.path);
        request.files.add(
          await http.MultipartFile.fromPath(
            'media',
            file.path,
            contentType: MediaType.parse(mimeType),
          ),
        );
      }

      // Add audio file if present
      if (audioFile != null) {
        request.files.add(
          await http.MultipartFile.fromPath(
            'audio',
            audioFile.path,
            contentType: MediaType.parse('audio/webm'),
          ),
        );
      }

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);
      final data = json.decode(response.body);

      if (response.statusCode >= 200 && response.statusCode < 300) {
        return {'success': true, 'data': data};
      } else {
        return {'success': false, 'error': data['error'] ?? 'Analysis failed'};
      }
    } catch (e) {
      return {'success': false, 'error': 'Network error: ${e.toString()}'};
    }
  }

  /// Get all analyses for a child
  Future<Map<String, dynamic>> getAnalyses(String childId) async {
    return _request('GET', '/analysis/$childId');
  }

  /// Get a specific analysis
  Future<Map<String, dynamic>> getAnalysis(String childId, String analysisId) async {
    return _request('GET', '/analysis/$childId/$analysisId');
  }

  /// Get WHO milestones for age
  Future<Map<String, dynamic>> getMilestones(int ageMonths) async {
    return _request('GET', '/analysis/milestones/$ageMonths');
  }

  /// Calculate growth percentiles
  Future<Map<String, dynamic>> getGrowthPercentiles({
    required double weight,
    required double height,
    double? headCircumference,
    required int ageMonths,
    required String gender,
  }) async {
    return _request('POST', '/analysis/growth-percentiles', body: {
      'weight': weight,
      'height': height,
      'headCircumference': headCircumference,
      'ageMonths': ageMonths,
      'gender': gender,
    });
  }

  // ==================== Stories ====================

  /// Get available story themes
  Future<Map<String, dynamic>> getStoryThemes() async {
    return _request('GET', '/stories/themes');
  }

  /// Get all stories for a child
  Future<Map<String, dynamic>> getStories(String childId) async {
    return _request('GET', '/stories/$childId');
  }

  /// Generate a new bedtime story
  Future<Map<String, dynamic>> generateStory({
    required String childId,
    required String themeId,
  }) async {
    return _request('POST', '/stories', body: {
      'childId': childId,
      'themeId': themeId,
    });
  }

  /// Get a specific story
  Future<Map<String, dynamic>> getStory(String childId, String storyId) async {
    return _request('GET', '/stories/$childId/$storyId');
  }

  /// Toggle story favorite status
  Future<Map<String, dynamic>> toggleStoryFavorite(String childId, String storyId) async {
    return _request('PATCH', '/stories/$childId/$storyId/favorite');
  }

  /// Delete a story
  Future<Map<String, dynamic>> deleteStory(String childId, String storyId) async {
    return _request('DELETE', '/stories/$childId/$storyId');
  }

  // ==================== Timeline ====================

  /// Get timeline entries for a child
  Future<Map<String, dynamic>> getTimeline(String childId) async {
    return _request('GET', '/timeline/$childId');
  }

  /// Add a timeline entry
  Future<Map<String, dynamic>> addTimelineEntry({
    required String childId,
    required String type,
    required String title,
    String? description,
    required DateTime date,
    String? mediaUrl,
  }) async {
    return _request('POST', '/timeline', body: {
      'childId': childId,
      'type': type,
      'title': title,
      'description': description,
      'date': date.toIso8601String(),
      'mediaUrl': mediaUrl,
    });
  }

  /// Add a growth measurement
  Future<Map<String, dynamic>> addMeasurement({
    required String childId,
    required double weight,
    required double height,
    double? headCircumference,
    required DateTime date,
  }) async {
    return _request('POST', '/timeline/measurement', body: {
      'childId': childId,
      'weight': weight,
      'height': height,
      'headCircumference': headCircumference,
      'date': date.toIso8601String(),
    });
  }

  /// Get growth measurements for a child
  Future<Map<String, dynamic>> getMeasurements(String childId) async {
    return _request('GET', '/timeline/measurements/$childId');
  }

  // ==================== Recommendations ====================

  /// Get product recommendations
  Future<Map<String, dynamic>> getProductRecommendations(
    String childId, {
    String category = 'toys',
  }) async {
    return _request(
      'GET',
      '/recommendations/products/$childId',
      queryParams: {'category': category},
    );
  }

  /// Get activity recommendations
  Future<Map<String, dynamic>> getActivities(
    String childId, {
    String? domain,
  }) async {
    return _request(
      'GET',
      '/recommendations/activities/$childId',
      queryParams: domain != null ? {'domain': domain} : null,
    );
  }

  /// Get recipe recommendations
  Future<Map<String, dynamic>> getRecipes(
    String childId, {
    int count = 3,
  }) async {
    return _request(
      'GET',
      '/recommendations/recipes/$childId',
      queryParams: {'count': count.toString()},
    );
  }

  /// Get parenting tips
  Future<Map<String, dynamic>> getParentingTips(
    String childId, {
    String? focusArea,
  }) async {
    return _request(
      'GET',
      '/recommendations/tips/$childId',
      queryParams: focusArea != null ? {'focusArea': focusArea} : null,
    );
  }

  /// Get WHO sources
  Future<Map<String, dynamic>> getWHOSources({String? region}) async {
    return _request(
      'GET',
      '/recommendations/sources',
      queryParams: region != null ? {'region': region} : null,
    );
  }

  // ==================== Milestone Tracking ====================

  /// Get achieved and watched milestones for a child
  Future<Map<String, dynamic>> getChildMilestones(String childId) async {
    return _request('GET', '/children/$childId/milestones');
  }

  /// Mark a milestone as achieved
  Future<Map<String, dynamic>> markMilestoneAchieved(
    String childId,
    String milestoneId, {
    String? achievedDate,
    String? notes,
    String confirmedBy = 'parent',
  }) async {
    return _request('POST', '/children/$childId/milestones/$milestoneId', body: {
      'achievedDate': achievedDate ?? DateTime.now().toIso8601String(),
      'notes': notes,
      'confirmedBy': confirmedBy,
    });
  }

  /// Unmark a milestone (remove from achieved)
  Future<Map<String, dynamic>> unmarkMilestoneAchieved(
    String childId,
    String milestoneId,
  ) async {
    return _request('DELETE', '/children/$childId/milestones/$milestoneId');
  }

  /// Add milestone to watch list
  Future<Map<String, dynamic>> watchMilestone(
    String childId,
    String milestoneId,
  ) async {
    return _request('POST', '/children/$childId/milestones/$milestoneId/watch');
  }

  /// Remove milestone from watch list
  Future<Map<String, dynamic>> unwatchMilestone(
    String childId,
    String milestoneId,
  ) async {
    return _request('DELETE', '/children/$childId/milestones/$milestoneId/watch');
  }

  // ==================== Helpers ====================

  String _getMimeType(String path) {
    final ext = path.split('.').last.toLowerCase();
    switch (ext) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'gif':
        return 'image/gif';
      case 'webp':
        return 'image/webp';
      case 'mp4':
        return 'video/mp4';
      case 'webm':
        return 'video/webm';
      case 'mov':
        return 'video/quicktime';
      case 'wav':
        return 'audio/wav';
      case 'm4a':
        return 'audio/m4a';
      default:
        return 'application/octet-stream';
    }
  }
}
