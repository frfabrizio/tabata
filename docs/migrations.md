# Conventions des migrations

## Versioning
- Les migrations sont numérotées de façon stricte et incrémentale : `001_v1.sql`, `002_v2_add_notes.sql`, etc.
- La migration `v1` définit le schéma initial (tables de base).
- Chaque migration suivante représente un pas unique et irréversible vers la version suivante.

## Idempotence
- Chaque migration doit être **idempotente** : relancer une migration ne doit pas provoquer d'erreur.
- Utilisez `IF NOT EXISTS` quand c'est possible, ou des garde-fous dans le runner (ex. vérifier l'existence d'une colonne avant un `ALTER TABLE`).

## Ordre strict
- Les migrations sont appliquées dans l'ordre croissant de leur numéro de version.
- Le runner refuse les versions manquantes ou dupliquées.

## Rollback
- Le rollback n'est pas supporté par le runner actuel.
- Si besoin futur : prévoir des migrations inverses (`down`), ou une stratégie de rollback contrôlée (dump/restore).

## Validation
- Un test de migrations vérifie l'application répétée (idempotence) et la présence des colonnes/index attendus.
