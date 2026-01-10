# Décision POC — Audio en arrière-plan

## Contexte
Objectif : valider la faisabilité et la valeur d’un POC d’audio en arrière-plan pour l’app.

## Critères de sélection
1. **Base installée**
   - Taille de la base utilisateurs active par OS.
   - Capacité à obtenir un retour rapide et significatif.
2. **Priorité produit**
   - Alignement avec les cas d’usage clés (écoute longue, mode hors écran, continuité).
   - Impact attendu sur la rétention/engagement.
3. **Contraintes techniques background**
   - Politiques OS pour l’audio en arrière-plan.
   - Complexité d’implémentation, risques de rejet store, consommation batterie.

## Comparaison iOS vs Android
### iOS
- **Base installée** : généralement plus faible en volume mais souvent plus engagée.
- **Background audio** : support natif robuste via les audio sessions et modes de fond.
- **Risques** : exigences strictes de justification d’usage audio en arrière-plan et review.

### Android
- **Base installée** : souvent plus large, plus hétérogène en devices.
- **Background audio** : support via services au premier plan et media playback; gestion plus variée selon fabricants.
- **Risques** : fragmentation (OEM), contraintes d’économie d’énergie, notifications obligatoires.

## Décision
**Choix : iOS pour le POC initial.**

### Justification
- **Priorité produit** : l’expérience d’écoute longue (sans écran) est un cas d’usage premium et plus prévisible sur iOS.
- **Contraintes techniques** : parcours d’implémentation plus standardisé (audio sessions), moins de fragmentation.
- **Qualité de signal** : retour utilisateur potentiellement plus qualitatif pour ajuster rapidement le POC.

## Prochaines étapes
- Définir le parcours utilisateur et les KPIs d’usage audio en arrière-plan.
- Spécifier l’implémentation technique iOS (audio session, interruptions, contrôle écran verrouillé).
- Préparer un plan d’extension Android en fonction des résultats.
