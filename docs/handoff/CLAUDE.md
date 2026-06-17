# CLAUDE.md — OBEY

> Ce fichier guide Claude Code (et tout assistant) sur ce dépôt. À garder à la
> racine. Mettre à jour au fil de l'implémentation.

## Le produit

**OBEY** — plateforme de gestion des volontaires (« STARs ») et de **génération
automatique de plannings de service** pour une église multi-départements.
Baseline : _« Disponibles pour Servir avec Amour »_.

L'app est structurée en **6 espaces** (= 6 rôles) + un flux d'authentification :

1. **Espace STAR** (mobile) — le volontaire : planning, confirmations, indispos, profil.
2. **Référent** (desktop) — pilote **un** département : génération/validation de
   plannings, équipe, remplacements, alertes.
3. **Coordination Générale** (desktop) — vue **globale** : validation/publication,
   stats, exports.
4. **Corps Pastoral** (desktop) — suivi **spirituel** (baptême, formations, Familles
   d'Impact) + département confidentiel **Intercession**.
5. **Vie des STARs** (desktop) — **équilibre de charge** : surcharges, multi-départements.
6. **Administrateur** (desktop) — comptes, départements, rôles, modèles, paramètres,
   journaux d'audit.

Le cœur métier est un **moteur de scoring** qui classe les STARs disponibles pour
chaque poste d'un événement. Voir `docs/handoff/04_PLANNING_ENGINE.md`.

## Source de vérité du design

Le design est **haute-fidélité et définitif**. Avant d'implémenter un écran, lire :

- `docs/handoff/README.md` — vue d'ensemble + feuille de route + endpoints suggérés
- `docs/handoff/01_DESIGN_TOKENS.md` — **couleurs, typo, espacements, ombres** (exacts)
- `docs/handoff/02_COMPONENTS.md` — bibliothèque de composants
- `docs/handoff/03_DATA_MODEL.md` — entités & champs
- `docs/handoff/04_PLANNING_ENGINE.md` — **algorithme de scoring (spec exacte)**
- `docs/handoff/05_SCREENS.md` — chaque écran : layout, copy, interactions
- `docs/handoff/06_ROLES_PERMISSIONS.md` — rôles, permissions, confidentialité
- `docs/handoff/screenshots/` — rendu de référence de chaque espace
- `docs/handoff/source_prototype/` — prototype HTML/React (référence, **pas** du
  code de prod)

> ⚠️ Adapte ces emplacements si tu ranges le package ailleurs que `docs/handoff/`.

## Règles métier non négociables (à appliquer côté serveur)

- **Scoring** : reproduire à l'identique `04_PLANNING_ENGINE.md` (bonus/malus/conflits).
  Couvrir par des tests unitaires.
- **Statuts excluants** : STARs `En pause` / `Ancien` exclus de la génération.
- **Délai de désistement** : un STAR ne se désiste seul que **jusqu'à J-7**
  (paramétrable). Au-delà → blocage + contacter le référent.
- **Confidentialité** : département **Intercession** + **données pastorales**
  (baptême, formations, Famille d'Impact, disciple) **exclus** des vues globales,
  exports standards et stats publiques. Accès réservé au **Corps Pastoral**.
- **Validation de compte** : inscription → compte **En attente** → connexion
  possible seulement après **approbation admin**.
- **Publication d'un planning** → notifie les STARs (canal selon paramètres :
  Interne / Email / WhatsApp). Journaliser (audit).
- **Cycle de vie planning** : `BROUILLON → EN_GENERATION → A_VALIDER → PUBLIE` (+ `ANNULE`).

## Design tokens (rappel rapide)

- Thème **« Lumière »**, dominante violette. Primaire `#7c5cd6`, fonds `#f6f2fb`/`#fff`.
- Polices : **Outfit** (display/titres/chiffres) + **Figtree** (texte). Google Fonts.
- Rayons : cartes **24px**, boutons/inputs **16px**, badges/tabs pilule.
- Ombres **teintées violet** (jamais noir neutre).
- Accents par espace : Référent/Coordination violet, Pastoral rose `#c97fb0`,
  Vie vert `#4fa57e`, Admin brique `#b8556a`.
- Détails exacts → `01_DESIGN_TOKENS.md`. Ne pas inventer de nouvelles couleurs.

## Stack (à confirmer / mettre à jour)

> _À compléter une fois la stack choisie._ Recommandation initiale (cf. README §5) :
> React + TypeScript + Vite ; React Router ; TanStack Query ; API REST/GraphQL ;
> moteur de scoring **côté serveur** ; PDF/Excel serveur pour les exports.

- **Commandes** : `<!-- TODO: install / dev / build / test / lint -->`
- **Arborescence** : `<!-- TODO -->`

## Conventions

- Recréer la bibliothèque de composants (`02_COMPONENTS.md`) plutôt que disperser
  les styles. Réutiliser les primitives (Btn, Badge, Card, Avatar, charts, shells).
- **Layout** : flex/grid + `gap` (pas de marges inline fragiles).
- **Mobile-first pour l'Espace STAR** (largeur de contenu ~440px, tab bar basse,
  cibles tactiles ≥ 44px).
- Textes d'UI en **français** (voir copy exacte dans `05_SCREENS.md`).
- **Accessibilité** : respecter `prefers-reduced-motion` (le prototype le fait).

## Pièges connus / à retirer

- Le prototype s'ouvre sur un **sélecteur d'espaces** + bouton flottant
  **« Démo · naviguer »** : artefacts de démo, **à supprimer** en prod (remplacer
  par redirection selon les rôles du `/me`).
- Toutes les **données sont fictives** (emails `@obey.church`). À remplacer par l'API.
- Le prototype ne persiste rien (hors `localStorage` de démo) : pas de backend.

## Ordre d'implémentation suggéré

1. Tokens + bibliothèque de composants.
2. Modèle de données + API + seed (parité visuelle avec les données fictives).
3. Auth + rôles/permissions.
4. **Moteur de scoring (serveur)** + tests.
5. Boucle de valeur centrale : **Référent (génération)** ↔ **STAR (confirmation)**.
6. Coordination, Pastoral, Vie, Admin.
7. Transverses : notifications, exports, stats, journaux.
