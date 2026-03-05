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
      'dateOfBirth': child.dateOfBirth.toIso8601String(),
      'gender': child.gender.name,
      'weight': child.weight,
      'height': child.height,
      'headCircumference': child.headCircumference,
      'region': child.region.name,
      'interests': child.interests,
      'favoriteCharacters': child.favoriteCharacters,
      'profilePhotoUrl': child.photoUrl,
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
      'dateOfBirth': child.dateOfBirth.toIso8601String(),
      'gender': child.gender.name,
      'weight': child.weight,
      'height': child.height,
      'headCircumference': child.headCircumference,
      'region': child.region.name,
      'interests': child.interests,
      'favoriteCharacters': child.favoriteCharacters,
      'profilePhotoUrl': child.photoUrl,
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

  /// Generate a custom story
  Future<Map<String, dynamic>> generateCustomStory({
    required String childId,
    String customPrompt = '',
    List<String> characters = const [],
    String setting = '',
    String action = '',
  }) async {
    return _request('POST', '/stories/custom', body: {
      'childId': childId,
      'customPrompt': customPrompt,
      'characters': characters,
      'setting': setting,
      'action': action,
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

  /// Toggle recipe favorite
  Future<Map<String, dynamic>> toggleRecipeFavorite(String recipeId, String childId) async {
    return _request('POST', '/recommendations/recipes/$recipeId/favorite', body: {'childId': childId});
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

  // ==================== Doctors ====================

  /// Get recommended doctors for a child based on their development analysis
  Future<Map<String, dynamic>> getRecommendedDoctors(String childId) async {
    return _request('GET', '/doctors/recommended/$childId');
  }

  /// Get doctors with optional domain and specialty filters
  Future<Map<String, dynamic>> getDoctors({String? domain, String? specialty}) async {
    final params = <String, String>{};
    if (domain != null) params['domain'] = domain;
    if (specialty != null) params['specialty'] = specialty;
    return _request('GET', '/doctors', queryParams: params.isNotEmpty ? params : null);
  }

  // ==================== Resources ====================

  /// Get improvement resources for a child, optionally filtered by domain and type
  Future<Map<String, dynamic>> getResources(String childId, {String? domain, String? type}) async {
    final params = <String, String>{};
    if (domain != null) params['domain'] = domain;
    if (type != null) params['type'] = type;
    return _request('GET', '/resources/$childId', queryParams: params.isNotEmpty ? params : null);
  }

  /// Regenerate improvement resources for a child
  Future<Map<String, dynamic>> regenerateResources(String childId) async {
    return _request('POST', '/resources/$childId/regenerate');
  }

  // ==================== Reports ====================

  /// Get all reports for a child
  Future<Map<String, dynamic>> getReports(String childId) async {
    return _request('GET', '/reports/$childId');
  }

  /// Generate a new developmental report for a child
  Future<Map<String, dynamic>> generateReport(String childId) async {
    return _request('POST', '/reports/$childId/generate');
  }

  /// Get a specific report
  Future<Map<String, dynamic>> getReport(String childId, String reportId) async {
    return _request('GET', '/reports/$childId/$reportId');
  }

  /// Get a report as PDF
  Future<Map<String, dynamic>> getReportPdf(String childId, String reportId) async {
    return _request('GET', '/reports/$childId/$reportId/pdf');
  }

  /// Share a report via email or link
  Future<Map<String, dynamic>> shareReport(
    String childId,
    String reportId,
    String method, {
    String? recipient,
  }) async {
    return _request('POST', '/reports/$childId/$reportId/share', body: {
      'method': method,
      if (recipient != null) 'recipient': recipient,
    });
  }

  // ==================== WHO Evidence ====================

  /// Get WHO evidence/sources with optional context, analysis, and region filters
  Future<Map<String, dynamic>> getWHOEvidence({
    String? context,
    String? analysisId,
    String? region,
  }) async {
    final params = <String, String>{};
    if (context != null) params['context'] = context;
    if (analysisId != null) params['analysisId'] = analysisId;
    if (region != null) params['region'] = region;
    return _request(
      'GET',
      '/recommendations/sources',
      queryParams: params.isNotEmpty ? params : null,
    );
  }

  // ==================== Community ====================

  /// Get community posts with optional filtering
  Future<Map<String, dynamic>> getCommunityPosts({
    String? category,
    String? search,
    String sort = 'recent',
    int limit = 20,
    int offset = 0,
  }) async {
    final params = <String, String>{
      'sort': sort,
      'limit': limit.toString(),
      'offset': offset.toString(),
    };
    if (category != null) params['category'] = category;
    if (search != null && search.isNotEmpty) params['search'] = search;
    return _request('GET', '/community/posts', queryParams: params);
  }

  /// Create a community post
  Future<Map<String, dynamic>> createCommunityPost({
    required String title,
    required String content,
    String category = 'general',
  }) async {
    return _request('POST', '/community/posts', body: {
      'title': title,
      'content': content,
      'category': category,
    });
  }

  /// Get a single community post with its comments
  Future<Map<String, dynamic>> getCommunityPost(String postId) async {
    return _request('GET', '/community/posts/$postId');
  }

  /// Toggle like on a community post
  Future<Map<String, dynamic>> toggleCommunityPostLike(String postId) async {
    return _request('POST', '/community/posts/$postId/like');
  }

  /// Add a comment to a community post
  Future<Map<String, dynamic>> addCommunityComment(String postId, String content) async {
    return _request('POST', '/community/posts/$postId/comments', body: {
      'content': content,
    });
  }

  /// Get trending community topics
  Future<Map<String, dynamic>> getCommunityTopics() async {
    return _request('GET', '/community/topics');
  }

  // ==================== Upload ====================

  /// Upload an image file to a specified storage bucket
  Future<Map<String, dynamic>> uploadImage(String filePath, String bucket) async {
    try {
      final uri = Uri.parse('$_baseUrl/upload/image');
      final request = http.MultipartRequest('POST', uri);

      if (_token != null) {
        request.headers['Authorization'] = 'Bearer $_token';
      }

      request.fields['bucket'] = bucket;
      request.files.add(await http.MultipartFile.fromPath('image', filePath));

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);
      final data = json.decode(response.body);

      if (response.statusCode >= 200 && response.statusCode < 300) {
        return {'success': true, 'data': data};
      } else {
        return {'success': false, 'error': data['error'] ?? 'Upload failed'};
      }
    } catch (e) {
      return {'success': false, 'error': 'Network error: ${e.toString()}'};
    }
  }

  // ==================== Baby Sound Analysis ====================

  /// Analyze baby sounds/vocalizations via backend
  Future<Map<String, dynamic>> analyzeBabySounds({
    required String childId,
    required String audioPath,
  }) async {
    try {
      final uri = Uri.parse('$_baseUrl/analysis/baby-sounds');
      final request = http.MultipartRequest('POST', uri);

      if (_token != null) {
        request.headers['Authorization'] = 'Bearer $_token';
      }

      request.fields['childId'] = childId;
      request.files.add(await http.MultipartFile.fromPath('audio', audioPath));

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);
      final data = json.decode(response.body);

      if (response.statusCode >= 200 && response.statusCode < 300) {
        return {'success': true, 'data': data};
      }
      return {'success': false, 'error': data['error'] ?? 'Failed'};
    } catch (e) {
      return {'success': false, 'error': 'Network error: ${e.toString()}'};
    }
  }

  /// Transcribe audio via backend
  Future<Map<String, dynamic>> transcribeAudio({
    required String audioPath,
  }) async {
    try {
      final uri = Uri.parse('$_baseUrl/analysis/transcribe');
      final request = http.MultipartRequest('POST', uri);

      if (_token != null) {
        request.headers['Authorization'] = 'Bearer $_token';
      }

      request.files.add(await http.MultipartFile.fromPath('audio', audioPath));

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);
      final data = json.decode(response.body);

      if (response.statusCode >= 200 && response.statusCode < 300) {
        return {'success': true, 'data': data};
      }
      return {'success': false, 'error': data['error'] ?? 'Failed'};
    } catch (e) {
      return {'success': false, 'error': 'Network error: ${e.toString()}'};
    }
  }

  // ==================== Story Illustrations ====================

  /// Generate a story illustration via backend
  Future<Map<String, dynamic>> generateIllustration({
    required String prompt,
    String? childPhotoBase64,
    String? childId,
  }) async {
    return _request('POST', '/stories/illustration', body: {
      'prompt': prompt,
      if (childPhotoBase64 != null) 'childPhotoBase64': childPhotoBase64,
      if (childId != null) 'childId': childId,
    });
  }

  // ==================== Config ====================

  /// Get app configuration (domain config, status labels, etc.)
  Future<Map<String, dynamic>> getAppConfig() async {
    return _request('GET', '/config');
  }

  // ==================== Analysis Trends ====================

  /// Get analysis trends for a child
  Future<Map<String, dynamic>> getAnalysisTrends({
    required String childId,
    String period = '3M',
  }) async {
    return _request('GET', '/analysis/$childId/trends', queryParams: {'period': period});
  }

  // ==================== Detailed Activities ====================

  /// Get detailed activity recommendations for a child
  Future<Map<String, dynamic>> getDetailedActivities({
    required String childId,
    String? domain,
  }) async {
    final params = <String, String>{};
    if (domain != null) params['domain'] = domain;
    return _request(
      'GET',
      '/recommendations/activities/$childId',
      queryParams: params.isEmpty ? null : params,
    );
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
