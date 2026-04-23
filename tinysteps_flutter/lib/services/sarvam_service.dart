import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';

/// Sarvam AI service for Indian language translation and text-to-speech.
/// Calls backend proxy endpoints that forward to Sarvam APIs.
class SarvamService {
  static final SarvamService _instance = SarvamService._();
  factory SarvamService() => _instance;
  SarvamService._();

  String get _baseUrl => ApiConfig.apiUrl;

  // TODO: This hardcoded language list should be fetched from the backend
  // /api/config endpoint, which now provides supported languages dynamically.
  /// Supported Indian languages (BCP-47 codes)
  static const Map<String, String> supportedLanguages = {
    'en-IN': 'English',
    'hi-IN': 'Hindi',
    'bn-IN': 'Bengali',
    'gu-IN': 'Gujarati',
    'kn-IN': 'Kannada',
    'ml-IN': 'Malayalam',
    'mr-IN': 'Marathi',
    'od-IN': 'Odia',
    'pa-IN': 'Punjabi',
    'ta-IN': 'Tamil',
    'te-IN': 'Telugu',
  };

  /// Translate text to a target Indian language via backend proxy.
  /// Returns the translated text string.
  Future<String> translateText(String text, String targetLanguageCode) async {
    final response = await http.post(
      Uri.parse('$_baseUrl/sarvam/translate'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'text': text,
        'targetLanguageCode': targetLanguageCode,
      }),
    );
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return data['translatedText'] as String;
    }
    throw Exception('Translation failed: ${response.statusCode}');
  }

  /// Convert text to speech via backend proxy.
  /// Returns a list of base64-encoded audio chunk strings.
  Future<List<String>> textToSpeech(
    String text,
    String targetLanguageCode,
  ) async {
    final response = await http.post(
      Uri.parse('$_baseUrl/sarvam/tts'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'text': text,
        'targetLanguageCode': targetLanguageCode,
      }),
    );
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return List<String>.from(data['audioChunks'] ?? []);
    }
    throw Exception('Text-to-speech failed: ${response.statusCode}');
  }
}
