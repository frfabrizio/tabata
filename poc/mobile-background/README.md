# POC: Lecture audio + timer background

Ce dossier contient un POC Flutter isolé pour valider :

- la lecture audio en background (notification média + reprise en arrière-plan),
- un timer longue durée (service/background task) qui logge des ticks,
- un écran simple pour piloter audio + timer et afficher l'état.

## Démarrage rapide

```bash
flutter pub get
flutter run
```

## Notes techniques

- `audio_service` + `just_audio` gèrent la session audio en arrière-plan.
- Le timer est géré dans le `AudioHandler` via un `Timer.periodic` et publie des événements (`customEvent`).
- Chaque tick est loggé via `dart:developer` (`Timer tick: ...`).

## Configuration native requise

Ce POC est volontairement minimal. Pour un fonctionnement complet en background sur mobile, ajoutez :

### Android

- Permission `FOREGROUND_SERVICE` et service de type `mediaPlayback`.
- Notification de lecture (déjà configurée via `AudioServiceConfig`).

### iOS

- Capabilities `Audio, AirPlay, and Picture in Picture`.
- Catégorie audio en background dans `Info.plist` (`UIBackgroundModes: audio`).

Consultez la documentation officielle de `audio_service`/`just_audio` pour les détails selon la version Flutter.
