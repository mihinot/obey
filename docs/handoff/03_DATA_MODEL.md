# 03 — Modèle de données

Toutes les données du prototype sont fictives (`data.jsx`, `data2.jsx`). Ce
document décrit les **entités** et leurs champs pour la modélisation backend.

---

## STAR (volontaire)

Le volontaire est l'entité centrale. Champs (cf. fabrique `S()` dans `data.jsx`) :

| Champ | Type | Description |
|---|---|---|
| `id` | int | Identifiant |
| `prenom`, `nom`, `nomComplet` | string | Identité |
| `email` | string | `prenom.nom@obey.church` (dérivé) |
| `tel` | string | Téléphone |
| `depts` | string[] | Codes de départements d'appartenance (multi possible) |
| `statut` | enum | `Nouveau · Actif · Occasionnel · En pause · Ancien` (voir ci-dessous) |
| `charge` | int | Nombre de services ce mois (pilote le niveau de charge) |
| `fiab` | float 0–1 | Fiabilité (taux de présence) |
| `desist` | int | Nombre de désistements récents |
| `indispos` | date[] | Dates d'indisponibilité (ISO) |
| **Données pastorales (confidentiel)** | | |
| `baptise` | bool | Baptisé |
| `f001`, `f101`, `f201` | bool | Parcours de formation 001 / 101 / 201 |
| `famille` | string\|null | Famille d'Impact d'appartenance |
| `disciple` | bool | Est disciple |

### Statut STAR — `STATUTS`
| Statut | tone | Effet métier |
|---|---|---|
| `Nouveau` | accent | malus −15 au score |
| `Actif` | ok | neutre |
| `Occasionnel` | warn | malus −10 |
| `En pause` | muted | **exclu** de la génération |
| `Ancien` | muted | **exclu** de la génération |

### Niveau de charge — `niveauCharge(n)`
Dérivé de `charge`. **Règle exacte** :
| Condition | key | label | tone | Effet score |
|---|---|---|---|---|
| `n > 6` | critique | Critique | danger | −30 (+ conflit avertissement) |
| `4 ≤ n ≤ 6` | elevee | Élevée | warn | −15 (+ conflit avertissement) |
| `n ≤ 1` | faible | Disponible | ok | +20 (bonus) |
| sinon (2–3) | normale | Normale | ok | neutre |

---

## Département — `DEPARTMENTS` / `DEPARTMENTS_ALL`

| Champ | Type | Description |
|---|---|---|
| `code` | string | Code court (ACC, SEC, LOU…) |
| `nom` | string | Nom complet |
| `couleur` | hex | Couleur d'identité |
| `confidentiel` | bool | Si vrai → masqué des vues globales/exports/stats (ex. Intercession) |
| `pilotage` | bool | Département de pilotage (Coordination, Corps Pastoral, MLA…) |
| `actif` | bool | Activable/désactivable (admin) |
| `membres` | int | Nb de membres |

Le prototype distingue **7 départements opérationnels** (`DEPARTMENTS`, utilisés
par le moteur) et la **liste complète ~26** (`DEPARTMENTS_ALL`, écran Admin §4 du
cahier des charges). En production : une seule table avec les flags ci-dessus.

---

## Événement — `EVENTS`

| Champ | Type | Description |
|---|---|---|
| `id` | string | Identifiant |
| `nom`, `type` | string | Nom + type (Culte dominical, Réunion de prière, Jeûne, Répétition…) |
| `date` | date ISO | Date |
| `jour` | string | Jour abrégé (Dim, Mer…) — dérivable |
| `dateLabel` | string | Libellé long (« Dimanche 22 juin ») — dérivable |
| `debut`, `fin` | string | Heures (HH:MM) |
| `lieu` | string | Lieu |
| `statut` | enum | Cycle de vie du planning (voir ci-dessous) |
| `besoins` | array | `[{ dept: code, requis: int }]` — postes requis par département |

### Statut d'événement / planning — `STATUT_EVT`
Cycle de vie : `BROUILLON → EN_GENERATION → A_VALIDER → PUBLIE` (+ `ANNULE`).
| Statut | label | tone |
|---|---|---|
| BROUILLON | Brouillon | muted |
| EN_GENERATION | En génération | primary |
| A_VALIDER | À valider | warn |
| PUBLIE | Publié | ok |
| ANNULE | Annulé | danger |

---

## Affectation

Lien STAR ↔ Événement ↔ Département produit par le moteur, puis confirmé.
| Champ | Type | Description |
|---|---|---|
| `starId` | int | STAR affecté |
| `eventId` / `dept` | | Événement + département |
| `role` | string | « STAR » (rôle sur le poste) |
| `statut` | enum | `Proposée · Validée · Publiée · Confirmée · Désistée` |
| `confirme` | bool | Le STAR a confirmé sa présence |
| `conflit` | enum\|null | `INCOMPATIBLE · AVERTISSEMENT` |

**Statuts côté STAR** (libellés vue mobile) : `Confirmée` (✓ vert), `Validée`/`Proposée`
(« À confirmer », warn), `Publiée` (primary), `Désistée` (danger).

---

## Compte en attente — `COMPTES`
Inscription à valider par l'admin : `{ id, nom, email, tel, dept (souhaité), date, statut }`.
Statuts : `En attente (warn) · Validé (ok) · Suspendu (muted) · Refusé (danger)`.

## Rôles globaux — `ROLES_GLOBAUX`
Rôles transverses **cumulables** : `ADMINISTRATEUR (danger) · COORDINATION_GENERALE
(primary) · CORPS_PASTORAL (accent) · VIE_DES_STARS (ok)`. Voir `06_ROLES_PERMISSIONS.md`.

## Modèle d'événement — `MODELES`
Besoins standards préremplis : `{ id, nom, actif, besoins: [[deptCode, n], …] }`.
Ex. « Culte dominical » → ACC 6, PRO 3, LOU 6, SEC 4. Sert au formulaire de création.

## Paramètres — `PARAMS`
Réglages globaux (admin), groupés : **Notifications** (WhatsApp on/off, rappel 48h),
**Planning** (délai désistement 7j), **Charge** (seuils normale 2–3 / élevée 4–6 /
critique >6). Champs : `{ cle, label, desc, type (toggle|number|range), val, unite, groupe }`.

## Alerte — `ALERTES`
`{ id, type, niveau (CRITIQUE|ATTENTION|INFO), titre, msg, evt? }`.
Types : poste non couvert, désistement, surcharge, peu sollicité, événement à risque.
Mapping niveau→tone : CRITIQUE→danger, ATTENTION→warn, INFO→primary.

## Notification — `NOTIFS` / `NOTIFS_FULL`
`{ id, titre, msg, date, lu, canal (INTERNE|EMAIL|WHATSAPP), tone }`.

## Journal d'audit — `JOURNAUX`
`{ id, user, action, entite, date, tone }`. Actions : Publication, Validation compte,
Génération, Modification, Désistement, Création, Consultation.

## Engagement (stats) — `ENGAGEMENT`
Par département : `{ dept, taux (%), services }`.
