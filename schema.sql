-- Schema definition for Tabata domain entities.
-- Targeted for PostgreSQL.

CREATE TYPE intervalle_type AS ENUM ('EXERCICE', 'RECUP');

CREATE TABLE exercice (
    id BIGSERIAL PRIMARY KEY,
    nom TEXT NOT NULL,
    categorie TEXT NOT NULL,
    duree_reference INTEGER NOT NULL CHECK (duree_reference > 0),
    calories_reference INTEGER NOT NULL CHECK (calories_reference >= 0)
);

CREATE TABLE intervalle (
    id BIGSERIAL PRIMARY KEY,
    type intervalle_type NOT NULL,
    duree INTEGER NOT NULL CHECK (duree > 0),
    exercice_id BIGINT REFERENCES exercice (id),
    CONSTRAINT intervalle_exercice_requis CHECK (
        (type = 'EXERCICE' AND exercice_id IS NOT NULL)
        OR (type = 'RECUP' AND exercice_id IS NULL)
    )
);

CREATE TABLE bloc (
    id BIGSERIAL PRIMARY KEY,
    nom TEXT NOT NULL,
    repetitions INTEGER NOT NULL CHECK (repetitions >= 1)
);

CREATE TABLE bloc_intervalles (
    bloc_id BIGINT NOT NULL REFERENCES bloc (id) ON DELETE CASCADE,
    intervalle_id BIGINT NOT NULL REFERENCES intervalle (id) ON DELETE RESTRICT,
    ordre INTEGER NOT NULL CHECK (ordre > 0),
    PRIMARY KEY (bloc_id, intervalle_id),
    UNIQUE (bloc_id, ordre)
);

CREATE TABLE seance (
    id BIGSERIAL PRIMARY KEY,
    nom TEXT NOT NULL,
    notes TEXT,
    echauffement_id BIGINT REFERENCES intervalle (id),
    recuperation_id BIGINT REFERENCES intervalle (id),
    duree_totale_calculee INTEGER
);

CREATE TABLE seance_blocs (
    seance_id BIGINT NOT NULL REFERENCES seance (id) ON DELETE CASCADE,
    bloc_id BIGINT NOT NULL REFERENCES bloc (id) ON DELETE RESTRICT,
    ordre INTEGER NOT NULL CHECK (ordre > 0),
    PRIMARY KEY (seance_id, bloc_id),
    UNIQUE (seance_id, ordre)
);

CREATE TABLE historique (
    id BIGSERIAL PRIMARY KEY,
    seance_id BIGINT NOT NULL REFERENCES seance (id) ON DELETE CASCADE,
    date_realisation DATE NOT NULL,
    duree_effective INTEGER CHECK (duree_effective > 0),
    calories INTEGER CHECK (calories >= 0)
);

CREATE INDEX exercice_categorie_idx ON exercice (categorie);
CREATE INDEX historique_date_realisation_idx ON historique (date_realisation);

COMMENT ON COLUMN seance.duree_totale_calculee IS
    'Somme des durées (échauffement + blocs * répétitions + récupération) calculée à partir des intervalles liés.';

CREATE VIEW seance_duree_calculee AS
WITH bloc_durees AS (
    SELECT
        sb.seance_id,
        b.id AS bloc_id,
        b.repetitions,
        SUM(i.duree) AS duree_bloc
    FROM seance_blocs sb
    JOIN bloc b ON b.id = sb.bloc_id
    JOIN bloc_intervalles bi ON bi.bloc_id = b.id
    JOIN intervalle i ON i.id = bi.intervalle_id
    GROUP BY sb.seance_id, b.id, b.repetitions
)
SELECT
    s.id AS seance_id,
    COALESCE(e.duree, 0)
    + COALESCE(r.duree, 0)
    + COALESCE(SUM(bd.duree_bloc * bd.repetitions), 0) AS duree_totale_calculee
FROM seance s
LEFT JOIN intervalle e ON e.id = s.echauffement_id
LEFT JOIN intervalle r ON r.id = s.recuperation_id
LEFT JOIN bloc_durees bd ON bd.seance_id = s.id
GROUP BY s.id, e.duree, r.duree;

CREATE VIEW seance_calories_estimees AS
WITH intervalle_calories AS (
    SELECT
        i.id AS intervalle_id,
        CASE
            WHEN i.type = 'EXERCICE' THEN
                (i.duree::NUMERIC / e.duree_reference) * e.calories_reference
            ELSE 0
        END AS calories_estimees
    FROM intervalle i
    LEFT JOIN exercice e ON e.id = i.exercice_id
),
bloc_calories AS (
    SELECT
        sb.seance_id,
        b.id AS bloc_id,
        b.repetitions,
        SUM(ic.calories_estimees) AS calories_bloc
    FROM seance_blocs sb
    JOIN bloc b ON b.id = sb.bloc_id
    JOIN bloc_intervalles bi ON bi.bloc_id = b.id
    JOIN intervalle_calories ic ON ic.intervalle_id = bi.intervalle_id
    GROUP BY sb.seance_id, b.id, b.repetitions
)
SELECT
    s.id AS seance_id,
    COALESCE(eic.calories_estimees, 0)
    + COALESCE(ric.calories_estimees, 0)
    + COALESCE(SUM(bc.calories_bloc * bc.repetitions), 0) AS calories_estimees
FROM seance s
LEFT JOIN intervalle_calories eic ON eic.intervalle_id = s.echauffement_id
LEFT JOIN intervalle_calories ric ON ric.intervalle_id = s.recuperation_id
LEFT JOIN bloc_calories bc ON bc.seance_id = s.id
GROUP BY s.id, eic.calories_estimees, ric.calories_estimees;
