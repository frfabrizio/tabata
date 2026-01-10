# Architecture par couches

## Modules

- `core` : utilitaires partagés et éléments techniques transverses.
- `domain` : logique métier (entités, use cases).
- `data` : implémentations d’accès aux données (API, DB, etc.).
- `ui` : écrans, composants et view models.

## Conventions de dépendances

- `ui` → `domain`
- `data` → `domain`
- `domain` → rien

> Objectif : préserver une séparation claire entre logique métier, accès aux données et présentation.
