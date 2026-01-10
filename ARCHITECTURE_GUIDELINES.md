# Architecture guidelines

## 1. Évaluer la complexité de la logique métier

Avant de choisir une architecture, commencez par qualifier la logique métier :

- **Règles métier** : nombre de règles, fréquence de changements, contraintes métier critiques.
- **Synchronisations** : besoins de sync bidirectionnelle, conflits, logique de merge.
- **Offline** : files d’attente d’actions, gestion d’états dégradés, reprises.
- **Orchestration** : workflows multi-écrans, validations en chaîne, dépendances.

> **Seuil** : si les règles/synchronisations/offline sont centrales au produit, considérez la logique métier comme **importante**.

## 2. Logique métier importante → Clean Architecture

Adoptez **Clean Architecture** avec séparation en trois couches :

- **Domain** : règles métier, entités, use cases, interfaces.
- **Data** : implémentations (API, DB, caches), mappers, sources de données.
- **UI** : views, widgets/écrans, navigation, adaptation de l’état pour l’affichage.

**Principe** : les dépendances pointent **vers** le Domain. Le Domain ne dépend de rien.

## 3. Beaucoup d’état global partagé → Redux

Si l’app partage un **état global** entre de nombreux écrans/features :

- **Flutter** : `flutter_redux`
- **React Native** : `@reduxjs/toolkit`

**Signal d’alarme** : nombreuses dépendances croisées, propagation d’état complexe, logique de synchronisation dispersée.

## 4. Définir le pattern d’état UI

Choisissez un pattern explicite pour l’état UI :

- **MVVM** (ViewModel) : préférer pour une logique d’écran testable.
- **Presenter** : acceptable si flux simple ou héritage d’une base existante.

**But** : isoler l’état UI du rendu et clarifier les responsabilités.

## 5. Documenter conventions et tests

Documentez dans le repo :

- La **séparation Domain / Data / UI**.
- Les **règles de dépendances** (Domain sans dépendances externes).
- Les **tests unitaires** exigés sur le Domain.
- Les conventions de nommage et d’emplacement des classes.

> Astuce : ajoutez un exemple de use case testable pour servir de modèle.
