import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:record/record.dart';
import 'package:path_provider/path_provider.dart';
import '../../models/models.dart';
import '../../utils/app_theme.dart';
import '../../animations/custom_animations.dart';
import 'analysis_loading_screen.dart';

class MediaCaptureScreen extends StatefulWidget {
  final ChildProfile child;

  const MediaCaptureScreen({super.key, required this.child});

  @override
  State<MediaCaptureScreen> createState() => _MediaCaptureScreenState();
}

class _MediaCaptureScreenState extends State<MediaCaptureScreen>
    with SingleTickerProviderStateMixin {
  final List<File> _mediaFiles = [];
  File? _audioFile;
  int _activeTab = 0;
  bool _isRecording = false;
  bool _isProcessingAudio = false;
  final _audioRecorder = AudioRecorder();

  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _tabController.addListener(() {
      setState(() => _activeTab = _tabController.index);
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    _audioRecorder.dispose();
    super.dispose();
  }

  Future<void> _pickMedia() async {
    final picker = ImagePicker();
    final files = await picker.pickMultipleMedia();

    if (files.isNotEmpty) {
      setState(() {
        _mediaFiles.addAll(files.map((f) => File(f.path)));
      });
    }
  }

  Future<void> _capturePhoto() async {
    final picker = ImagePicker();
    final file = await picker.pickImage(source: ImageSource.camera);

    if (file != null) {
      setState(() {
        _mediaFiles.add(File(file.path));
      });
    }
  }

  Future<void> _captureVideo() async {
    final picker = ImagePicker();
    final file = await picker.pickVideo(
      source: ImageSource.camera,
      maxDuration: const Duration(seconds: 60),
    );

    if (file != null) {
      setState(() {
        _mediaFiles.add(File(file.path));
      });
    }
  }

  void _removeMedia(int index) {
    setState(() {
      _mediaFiles.removeAt(index);
    });
  }

  Future<void> _startRecording() async {
    final hasPermission = await _audioRecorder.hasPermission();
    if (!hasPermission) return;

    final dir = await getTemporaryDirectory();
    final path = '${dir.path}/baby_audio_${DateTime.now().millisecondsSinceEpoch}.m4a';

    await _audioRecorder.start(
      const RecordConfig(encoder: AudioEncoder.aacLc),
      path: path,
    );

    setState(() => _isRecording = true);
  }

  Future<void> _stopRecording() async {
    final path = await _audioRecorder.stop();

    setState(() {
      _isRecording = false;
      _isProcessingAudio = true;
    });

    if (path != null) {
      setState(() {
        _audioFile = File(path);
        _isProcessingAudio = false;
      });
    } else {
      setState(() => _isProcessingAudio = false);
    }
  }

  void _clearAudio() {
    setState(() {
      _audioFile = null;
    });
  }

  void _startAnalysis() {
    if (_mediaFiles.isEmpty && _audioFile == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please add at least one photo, video, or voice recording'),
          backgroundColor: AppTheme.warning,
        ),
      );
      return;
    }

    Navigator.of(context).push(
      PageRouteBuilder(
        pageBuilder: (_, __, ___) => AnalysisLoadingScreen(
          child: widget.child,
          mediaFiles: _mediaFiles,
          audioFile: _audioFile,
        ),
        transitionsBuilder: (_, animation, __, child) {
          return FadeTransition(opacity: animation, child: child);
        },
        transitionDuration: const Duration(milliseconds: 400),
      ),
    );
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
                child: Row(
                  children: [
                    IconButton(
                      onPressed: () => Navigator.pop(context),
                      icon: const Icon(Icons.arrow_back_rounded),
                      style: IconButton.styleFrom(
                        backgroundColor: AppTheme.neutral100,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'New Analysis',
                            style: TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.w700,
                              color: AppTheme.neutral900,
                            ),
                          ),
                          Text(
                            'For ${widget.child.displayName}',
                            style: const TextStyle(
                              fontSize: 14,
                              color: AppTheme.neutral500,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              // Tabs
              Container(
                margin: const EdgeInsets.symmetric(horizontal: 20),
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: AppTheme.neutral100,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: TabBar(
                  controller: _tabController,
                  indicator: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    boxShadow: AppTheme.softShadow,
                  ),
                  labelColor: AppTheme.primaryGreen,
                  unselectedLabelColor: AppTheme.neutral500,
                  labelStyle: const TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                  ),
                  dividerColor: Colors.transparent,
                  tabs: const [
                    Tab(
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.upload_rounded, size: 18),
                          SizedBox(width: 6),
                          Text('Upload'),
                        ],
                      ),
                    ),
                    Tab(
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.camera_alt_rounded, size: 18),
                          SizedBox(width: 6),
                          Text('Capture'),
                        ],
                      ),
                    ),
                    Tab(
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.mic_rounded, size: 18),
                          SizedBox(width: 6),
                          Text('Voice'),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              // Content
              Expanded(
                child: TabBarView(
                  controller: _tabController,
                  children: [
                    _buildUploadTab(),
                    _buildCaptureTab(),
                    _buildVoiceTab(),
                  ],
                ),
              ),

              // Bottom Summary & Button
              _buildBottomSection(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildUploadTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          // Upload Zone
          GestureDetector(
            onTap: _pickMedia,
            child: Container(
              padding: const EdgeInsets.all(40),
              decoration: BoxDecoration(
                border: Border.all(
                  color: AppTheme.neutral300,
                  width: 2,
                  style: BorderStyle.solid,
                ),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Column(
                children: [
                  Container(
                    width: 72,
                    height: 72,
                    decoration: BoxDecoration(
                      color: AppTheme.primaryGreen.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(24),
                    ),
                    child: const Icon(
                      Icons.cloud_upload_rounded,
                      size: 36,
                      color: AppTheme.primaryGreen,
                    ),
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'Upload Photos or Videos',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.neutral800,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'of ${widget.child.displayName} doing activities',
                    style: const TextStyle(
                      fontSize: 14,
                      color: AppTheme.neutral500,
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'PNG, JPG, MP4 up to 50MB',
                    style: TextStyle(
                      fontSize: 12,
                      color: AppTheme.neutral400,
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 20),

          // Media Grid
          if (_mediaFiles.isNotEmpty)
            _buildMediaGrid(),
        ],
      ),
    );
  }

  Widget _buildCaptureTab() {
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(32),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  AppTheme.secondaryBlue.withOpacity(0.1),
                  AppTheme.secondaryPurple.withOpacity(0.1),
                ],
              ),
              borderRadius: BorderRadius.circular(24),
            ),
            child: Column(
              children: [
                Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    color: AppTheme.secondaryBlue.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(28),
                  ),
                  child: const Icon(
                    Icons.camera_alt_rounded,
                    size: 40,
                    color: AppTheme.secondaryBlue,
                  ),
                ),
                const SizedBox(height: 20),
                const Text(
                  'Capture in the Moment',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.neutral800,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Record ${widget.child.displayName} doing activities\nlike playing, walking, or talking',
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontSize: 14,
                    color: AppTheme.neutral600,
                  ),
                ),
                const SizedBox(height: 24),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    ElevatedButton.icon(
                      onPressed: _capturePhoto,
                      icon: const Icon(Icons.camera_alt_rounded),
                      label: const Text('Photo'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.secondaryBlue,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 24,
                          vertical: 14,
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    ElevatedButton.icon(
                      onPressed: _captureVideo,
                      icon: const Icon(Icons.videocam_rounded),
                      label: const Text('Video'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.secondaryPurple,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 24,
                          vertical: 14,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          if (_mediaFiles.isNotEmpty)
            _buildMediaGrid(),
        ],
      ),
    );
  }

  Widget _buildVoiceTab() {
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(32),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  AppTheme.secondaryPurple.withOpacity(0.1),
                  AppTheme.secondaryPink.withOpacity(0.1),
                ],
              ),
              borderRadius: BorderRadius.circular(24),
            ),
            child: Column(
              children: [
                // Recording indicator
                AnimatedContainer(
                  duration: const Duration(milliseconds: 300),
                  width: 100,
                  height: 100,
                  decoration: BoxDecoration(
                    color: _isRecording
                        ? AppTheme.error.withOpacity(0.2)
                        : AppTheme.secondaryPurple.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(36),
                  ),
                  child: _isRecording
                      ? PulseAnimation(
                          child: Icon(
                            Icons.mic_rounded,
                            size: 48,
                            color: AppTheme.error,
                          ),
                        )
                      : _isProcessingAudio
                          ? const CircularProgressIndicator(
                              color: AppTheme.secondaryPurple,
                            )
                          : Icon(
                              _audioFile != null
                                  ? Icons.check_circle_rounded
                                  : Icons.mic_rounded,
                              size: 48,
                              color: _audioFile != null
                                  ? AppTheme.success
                                  : AppTheme.secondaryPurple,
                            ),
                ),
                const SizedBox(height: 20),
                Text(
                  _isRecording
                      ? 'Recording...'
                      : _isProcessingAudio
                          ? 'Processing...'
                          : _audioFile != null
                              ? 'Audio Recorded!'
                              : 'Record Baby Sounds',
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.neutral800,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  _isRecording
                      ? 'Tap to stop'
                      : _audioFile != null
                          ? 'Ready for analysis'
                          : 'Capture babbling, words, or sounds',
                  style: const TextStyle(
                    fontSize: 14,
                    color: AppTheme.neutral600,
                  ),
                ),
                const SizedBox(height: 24),
                if (_audioFile == null)
                  ElevatedButton(
                    onPressed: _isRecording ? _stopRecording : _startRecording,
                    style: ElevatedButton.styleFrom(
                      backgroundColor:
                          _isRecording ? AppTheme.error : AppTheme.secondaryPurple,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 32,
                        vertical: 16,
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(_isRecording ? Icons.stop_rounded : Icons.mic_rounded),
                        const SizedBox(width: 8),
                        Text(_isRecording ? 'Stop Recording' : 'Start Recording'),
                      ],
                    ),
                  )
                else
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 10,
                        ),
                        decoration: BoxDecoration(
                          color: AppTheme.success.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: const Row(
                          children: [
                            Icon(Icons.check_rounded,
                                color: AppTheme.success, size: 18),
                            SizedBox(width: 8),
                            Text(
                              'Audio Ready',
                              style: TextStyle(
                                color: AppTheme.success,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 12),
                      TextButton(
                        onPressed: _clearAudio,
                        child: const Text('Record Again'),
                      ),
                    ],
                  ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppTheme.secondaryPurple.withOpacity(0.1),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Row(
              children: [
                const Icon(Icons.info_outline_rounded,
                    color: AppTheme.secondaryPurple, size: 20),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'Voice analysis helps assess ${widget.child.displayName}\'s language development based on WHO milestones.',
                    style: TextStyle(
                      fontSize: 13,
                      color: AppTheme.secondaryPurple.withOpacity(0.8),
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

  Widget _buildMediaGrid() {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
      ),
      itemCount: _mediaFiles.length + 1,
      itemBuilder: (context, index) {
        if (index == _mediaFiles.length) {
          return GestureDetector(
            onTap: _pickMedia,
            child: Container(
              decoration: BoxDecoration(
                border: Border.all(color: AppTheme.neutral300, width: 2),
                borderRadius: BorderRadius.circular(16),
              ),
              child: const Icon(
                Icons.add_rounded,
                color: AppTheme.neutral400,
                size: 32,
              ),
            ),
          );
        }

        final file = _mediaFiles[index];
        final isVideo = file.path.toLowerCase().endsWith('.mp4') ||
            file.path.toLowerCase().endsWith('.mov');

        return Stack(
          children: [
            Container(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(16),
                color: AppTheme.neutral200,
              ),
              clipBehavior: Clip.antiAlias,
              child: isVideo
                  ? Container(
                      color: AppTheme.neutral800,
                      child: const Center(
                        child: Icon(Icons.play_circle_filled,
                            color: Colors.white, size: 40),
                      ),
                    )
                  : Image.file(
                      file,
                      fit: BoxFit.cover,
                      width: double.infinity,
                      height: double.infinity,
                    ),
            ),
            Positioned(
              top: 6,
              right: 6,
              child: GestureDetector(
                onTap: () => _removeMedia(index),
                child: Container(
                  width: 28,
                  height: 28,
                  decoration: BoxDecoration(
                    color: AppTheme.error,
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: const Icon(Icons.close_rounded,
                      color: Colors.white, size: 18),
                ),
              ),
            ),
            Positioned(
              bottom: 6,
              left: 6,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.black54,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      isVideo ? Icons.videocam_rounded : Icons.image_rounded,
                      color: Colors.white,
                      size: 14,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      isVideo ? 'Video' : 'Photo',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 11,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _buildBottomSection() {
    final hasMedia = _mediaFiles.isNotEmpty || _audioFile != null;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 20,
            offset: const Offset(0, -5),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (hasMedia)
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppTheme.primaryGreen.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.check_circle_rounded,
                        color: AppTheme.primaryGreen, size: 20),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        'Ready: ${_mediaFiles.length} media${_audioFile != null ? ' + audio' : ''}',
                        style: const TextStyle(
                          color: AppTheme.primaryGreen,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: hasMedia ? _startAnalysis : null,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primaryGreen,
                disabledBackgroundColor: AppTheme.neutral300,
                padding: const EdgeInsets.symmetric(vertical: 18),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.auto_awesome_rounded),
                  SizedBox(width: 8),
                  Text(
                    'Start Analysis',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
