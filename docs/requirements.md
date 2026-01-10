# Exigences audio & timer

## 1) Grille d’exigences audio

| Dimension | Exigence cible | Détails/Notes | Priorité |
| --- | --- | --- | --- |
| Latence cible (ms) | **≤ 50 ms** pour les actions de lecture (play/pause/skip) | Mesurée entre l’action utilisateur et l’audio audible. Acceptable jusqu’à 100 ms pour transitions non critiques. | Haute |
| Lecture en background | **Obligatoire** | Continuer la lecture si l’app passe en arrière-plan ou écran éteint. Respect des politiques OS. | Haute |
| Mixage/ducking avec autres apps | **Ducking** lorsque d’autres apps sont en lecture vocale ; **mixage** avec musique si activé par l’utilisateur | Exposer un réglage pour autoriser le mixage (ex: superposer à une playlist). | Moyenne |
| Interruption (appels, Siri/Assistant) | **Pause automatique + sauvegarde du state** | Détecter interruptions système et sauvegarder position/état. | Haute |
| Reprise après interruption | **Reprise automatique** si interruption courte (≤ 30 s), sinon **proposer reprise** | Notifier l’utilisateur ou reprendre selon le contexte (ex: appel terminé). | Moyenne |
| Qualité perçue | **Aucune coupure audible** lors des transitions | Pré-chargement ou buffer minimal. | Haute |

## 2) Grille d’exigences timer

| Dimension | Exigence cible | Détails/Notes | Priorité |
| --- | --- | --- | --- |
| Précision attendue (ms) | **± 50 ms** pour transitions sensibles | Mesurée sur sessions 30–60 min. | Haute |
| Tolérance de drift | **≤ 0,5 %** sur 60 min | Exemple: ≤ 18 s sur 60 min ; objectif idéal ≤ 5 s. | Moyenne |
| Écran éteint | **Le timer continue** | La logique doit rester fiable en background/écran éteint. | Haute |
| Durée maximale (long‑running) | **≥ 8 h** | Permet usages étendus (coaching, longues sessions). | Basse |
| Reprise après pause | **Précise et cohérente** | Conserver temps restant/écoulé avec recalcul basé sur horodatage. | Haute |
| Compatibilité modes économie | **Dégradation contrôlée** | Accepter une précision plus faible si OS limite l’exécution. | Moyenne |

## 3) Scénarios d’usage

1. **Séance 30–60 min (foreground)**  
   - Lancement d’une session structurée avec transitions audio rapides.  
   - Latence et précision du timer ressenties comme « instantanées ».
2. **Transitions rapides (interval training)**  
   - Enchaînement de phases courtes (20–60 s).  
   - Notification audio + ajustement du timer sans décrochage.
3. **App en background / écran éteint**  
   - Utilisateur verrouille l’écran pendant la séance.  
   - Audio et timer doivent rester fiables.
4. **Interruption système (appel entrant)**  
   - L’appel coupe l’audio, le timer se met en pause.  
   - À la fin de l’appel, reprise automatique ou avec confirmation.
5. **Mixage avec musique externe**  
   - L’utilisateur écoute de la musique et active le mixage.  
   - L’audio de guidage « ducking » pendant les annonces.

## 4) Validation avec utilisateurs/PO (priorisation)

**Objectif :** valider l’importance et les seuils (latence, précision, background).

### Méthode proposée
1. **Échantillon cible :** 5–8 utilisateurs finaux + PO (ou proxy métier).
2. **Format :** atelier 30–45 min + questionnaire court.
3. **Support :** grille d’exigences ci-dessus avec vote (MoSCoW ou 1–5).

### Questions clés
- Quelle latence est perçue comme gênante ?  
- Quelles interruptions sont les plus fréquentes (appels, assistants) ?  
- Le mixage est-il indispensable ou optionnel ?  
- Quelle précision de timer est « suffisante » pour votre usage ?

### Sortie attendue
- **Priorisation signée** (Must/Should/Could) par PO.  
- **Seuils validés** (ex: latence ≤ 50 ms, drift ≤ 0,5 %).  
- **Cas critiques** listés pour tests (ex: écran éteint > 45 min).
