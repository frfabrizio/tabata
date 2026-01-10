import 'dart:async';
import 'dart:developer';

import 'package:audio_service/audio_service.dart';
import 'package:flutter/material.dart';
import 'package:just_audio/just_audio.dart';

const _audioUrl =
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  final handler = await AudioService.init(
    builder: () => PocBackgroundAudioHandler(),
    config: const AudioServiceConfig(
      androidNotificationChannelId: 'com.tabata.poc.background.audio',
      androidNotificationChannelName: 'POC Background Audio',
      androidNotificationOngoing: true,
    ),
  );

  runApp(PocApp(handler: handler));
}

class PocApp extends StatefulWidget {
  const PocApp({super.key, required this.handler});

  final AudioHandler handler;

  @override
  State<PocApp> createState() => _PocAppState();
}

class _PocAppState extends State<PocApp> {
  StreamSubscription<dynamic>? _eventSubscription;
  String _timerStatus = 'Arrêté';
  int _tickCount = 0;
  String _lastTickAt = '—';

  @override
  void initState() {
    super.initState();
    _eventSubscription = widget.handler.customEvent.listen((event) {
      if (event is Map) {
        final type = event['type'];
        if (type == 'timer') {
          setState(() {
            _timerStatus = event['status'] == 'running' ? 'En cours' : 'Arrêté';
          });
        }
        if (type == 'tick') {
          setState(() {
            _tickCount = event['count'] ?? _tickCount;
            _lastTickAt = event['timestamp'] ?? _lastTickAt;
          });
        }
      }
    });
  }

  @override
  void dispose() {
    _eventSubscription?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: Scaffold(
        appBar: AppBar(
          title: const Text('POC Audio + Background Timer'),
        ),
        body: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              StreamBuilder<PlaybackState>(
                stream: widget.handler.playbackState,
                builder: (context, snapshot) {
                  final state = snapshot.data ?? PlaybackState();
                  final isPlaying = state.playing;
                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Audio: ${isPlaying ? 'Lecture' : 'Arrêté'}'),
                      const SizedBox(height: 12),
                      Wrap(
                        spacing: 12,
                        children: [
                          ElevatedButton(
                            onPressed: () => widget.handler.play(),
                            child: const Text('Démarrer audio'),
                          ),
                          ElevatedButton(
                            onPressed: () => widget.handler.pause(),
                            child: const Text('Pause audio'),
                          ),
                          ElevatedButton(
                            onPressed: () => widget.handler.stop(),
                            child: const Text('Stop audio'),
                          ),
                        ],
                      ),
                    ],
                  );
                },
              ),
              const Divider(height: 32),
              Text('Timer background: $_timerStatus'),
              const SizedBox(height: 12),
              Wrap(
                spacing: 12,
                children: [
                  ElevatedButton(
                    onPressed: () =>
                        widget.handler.customAction('startTimer'),
                    child: const Text('Démarrer timer'),
                  ),
                  ElevatedButton(
                    onPressed: () =>
                        widget.handler.customAction('stopTimer'),
                    child: const Text('Stop timer'),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Text('Dernier tick: $_tickCount'),
              Text('Horodatage: $_lastTickAt'),
            ],
          ),
        ),
      ),
    );
  }
}

class PocBackgroundAudioHandler extends BaseAudioHandler
    with QueueHandler, SeekHandler {
  PocBackgroundAudioHandler() {
    _player.playbackEventStream.listen(_broadcastState);
    _init();
  }

  final AudioPlayer _player = AudioPlayer();
  Timer? _timer;
  int _tickCount = 0;

  Future<void> _init() async {
    const mediaItem = MediaItem(
      id: _audioUrl,
      title: 'POC Background Track',
      artist: 'SoundHelix',
      duration: Duration(minutes: 6, seconds: 12),
    );
    this.mediaItem.add(mediaItem);
    await _player.setAudioSource(AudioSource.uri(Uri.parse(_audioUrl)));
  }

  @override
  Future<void> play() => _player.play();

  @override
  Future<void> pause() => _player.pause();

  @override
  Future<void> stop() async {
    await _player.stop();
    await super.stop();
  }

  @override
  Future<dynamic> customAction(String name, [Map<String, dynamic>? extras]) {
    switch (name) {
      case 'startTimer':
        return _startTimer();
      case 'stopTimer':
        return _stopTimer();
      default:
        return super.customAction(name, extras);
    }
  }

  Future<void> _startTimer() async {
    if (_timer != null) {
      return;
    }
    _tickCount = 0;
    customEvent.add({'type': 'timer', 'status': 'running'});
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      _tickCount += 1;
      final timestamp = DateTime.now().toIso8601String();
      log('Timer tick: $_tickCount @ $timestamp');
      customEvent.add({
        'type': 'tick',
        'count': _tickCount,
        'timestamp': timestamp,
      });
    });
  }

  Future<void> _stopTimer() async {
    _timer?.cancel();
    _timer = null;
    customEvent.add({'type': 'timer', 'status': 'stopped'});
  }

  void _broadcastState(PlaybackEvent event) {
    playbackState.add(
      playbackState.value.copyWith(
        controls: [
          MediaControl.play,
          MediaControl.pause,
          MediaControl.stop,
        ],
        androidCompactActionIndices: const [0, 1, 2],
        processingState: _transformProcessingState(event.processingState),
        playing: _player.playing,
        updatePosition: _player.position,
        bufferedPosition: _player.bufferedPosition,
        speed: _player.speed,
      ),
    );
  }

  AudioProcessingState _transformProcessingState(
    ProcessingState processingState,
  ) {
    switch (processingState) {
      case ProcessingState.idle:
        return AudioProcessingState.idle;
      case ProcessingState.loading:
        return AudioProcessingState.loading;
      case ProcessingState.buffering:
        return AudioProcessingState.buffering;
      case ProcessingState.ready:
        return AudioProcessingState.ready;
      case ProcessingState.completed:
        return AudioProcessingState.completed;
    }
  }
}
