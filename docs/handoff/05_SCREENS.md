# 05 — Écrans (par espace)

Inventaire complet des écrans. Chaque écran correspond à un composant dans
`source_prototype/`. Copy = textes exacts du prototype (français).

Routage du prototype (`app.jsx`) : `auth → chooser (sélecteur d'espace démo) →
app` avec `role` ∈ {star, referent, coordination, pastoral, vie, admin}.
**En production**, remplacer le `chooser` par une redirection selon les rôles de
l'utilisateur connecté.

---

## A. Authentification (`auth.jsx`) — mobile/centré

Coquille `AuthShell` : fond dégradé radial `primarySoft→bg`, carte centrée
(max 420px), Wordmark 40 + baseline italique « Disponibles pour Servir avec Amour »,
pied « OBEY · Plateforme de service · V1 ».

1. **Connexion** — titre « Content de te revoir ». Champs email + mot de passe,
   lien « Mot de passe oublié ? », bouton « Se connecter », séparateur « ou »,
   bouton « Continuer avec Google », lien « Crée ton compte ».
2. **Inscription** — « Rejoins le service ». Prénom/Nom (2 col), email, téléphone,
   mot de passe (hint 8 car. min), case captcha, « Créer mon compte » → écran d'attente.
3. **Compte en attente** — icône horloge (warn), « Compte en attente », message de
   validation admin, retour connexion.
4. **Mot de passe oublié** — email → « Envoyer le lien » → état succès (check vert,
   « Email envoyé »).

---

## B. Espace STAR (`star.jsx`) — **mobile** (max 440px, tab bar basse)

Status bar factice (9:41 · « ♥ Servir »). Tab bar : **Accueil · Planning · Indispos · Profil**.

1. **Accueil** — « Bonjour {prénom} ». Carte charge du mois (ProgressBar + pilule
   niveau). **Prochain service** : carte dégradée (date·heure, J-N, nom, lieu·dept,
   statut, « Détails »). 2 tuiles (services à confirmer / indisponibilités).
   Liste « Notifications récentes ».
2. **Mon planning** — liste des affectations (carte date à gauche + nom + dept·heure
   + badge statut). Tri chronologique ; désistées grisées.
3. **Mes indispos** — bouton « Ajouter » (form inline : du/au/motif). Liste des
   indisponibilités supprimables. Vide → message.
4. **Profil** — Avatar 84, nom, email, badges statut+depts. Carte infos (téléphone,
   baptême, formations 001/101/201, Famille d'Impact). Bouton « Se déconnecter ».

**Détail d'affectation** (bottom sheet `EventDetailSheet`) : poignée, statut, nom,
infos (date/heure/lieu/dept·rôle). Actions :
- « Confirmer ma présence » (si Proposée/Validée).
- « Demander un désistement » **si J ≥ 7** ; sinon encart warn « Délai dépassé (J-7) —
  contacte ton référent/adjoint/coordonnateur ». _(Règle métier, cf. `06`.)_

---

## C. Référent (`referent.jsx`) — desktop, sidebar « DÉPARTEMENT · Accueil »

Nav : **Tableau de bord · Planning · Remplacements (badge) · Équipe · Alertes (badge)**.

1. **Tableau de bord** — 4 KPI (prochain événement, plannings à traiter, STARs
   actifs, alertes). `NextEventCard` (carte dégradée : couverture par département +
   « Générer / voir le planning »). Liste « Événements à venir ». Colonne droite :
   Alertes + « Charge de l'équipe » (top 5).
2. **Planning · Accueil** — `PlanningViews` (3 vues, voir ci-dessous) filtré sur ACC.
   Bouton « Nouvel événement ».
3. **Détail événement** (`EventDetail`) — en-tête (nom, statut, date/heure/lieu),
   bouton « Générer le planning », besoins par département (cartes couverture).
4. **Génération** (`GenerationView`) — voir `04_PLANNING_ENGINE.md`.
5. **Remplacements** — cartes désistement : STAR désisté + remplaçant **suggéré par
   le moteur** (disponible · charge) + actions « Autre » / « Valider ».
6. **Équipe** — recherche + grille de cartes membres (Avatar, tel, statut, depts,
   barre de charge).
7. **Alertes** — onglets (Toutes/Critiques/Attention/Info) + liste `AlertCard`
   (bordure gauche colorée selon niveau, cliquable vers l'événement).

### `PlanningViews` (partagé Référent + Coordination + Pastoral) — `planning.jsx`
Sélecteur `Tabs` : **Liste · Calendrier · Par département** + compteur d'événements.
- **Liste** (`VueListe`) : cartes événement (barre couleur de couverture à gauche,
  date, nom + badge statut, heure/lieu, pastilles départements, ratio postes + barre).
- **Calendrier** (`VueCalendrier`) : grille juin 2026 (Lun→Dim), jour courant = 15
  surligné, événements en blocs colorés (nom + heure + ratio).
- **Par département** (`VueTableau`) : tableau événements × départements, cellule =
  `couverts/requis` coloré (1ʳᵉ colonne sticky).

---

## D. Coordination Générale (`coordination.jsx`) — desktop (`DeskShell`, accent primary)

Nav : **Tableau de bord · Planning global · Validation (badge) · Alertes critiques
(badge) · Départements · Statistiques · Exports**.

1. **Tableau de bord global** — 4 StatTiles (événements à venir, plannings à valider,
   taux de couverture, alertes critiques). `BarChart` couverture par département +
   colonne « À valider ».
2. **Planning global** — `PlanningViews` (tous départements) + « Nouvel événement »
   (→ `EventForm`).
3. **Validation** — liste des plannings (À valider/Brouillon/Publié) avec ratio +
   « Examiner » (→ `GenerationView` pour publier).
4. **Alertes critiques** — liste `AlertCard` (inclut « événement à risque »).
5. **Départements** — grille de cartes couverture (barre + ratio + nb membres).
6. **Statistiques** (`StatsGlobales`, partagé avec Pastoral) — `BarChart` charge des
   volontaires + `Donut` taux d'engagement 82% + engagement par département.
7. **Exports** (`ExportsScreen`) — voir §F.
8. **Notifications** (`NotifCenter`) — voir §F.

---

## E. Corps Pastoral (`pastoralvie.jsx`) — desktop (accent `accent` rose) · **confidentiel**

Nav : **Vue globale · Suivi pastoral · Intercession · Planning · Alertes pastorales ·
Statistiques d'engagement**. `ConfidentialBadge` sur les écrans sensibles.

1. **Vue globale** — StatTiles (STARs actifs, baptisés, en formation, nouveaux à
   accompagner). Carte « Formations » (barres baptême/001/101/201) + « Attention
   pastorale » (STARs à suivre).
2. **Suivi pastoral** — tableau confidentiel : STAR × (Baptême, F.001/101/201,
   Famille d'Impact, Disciple) avec checks. Recherche.
3. **Intercession** — département **confidentiel** : encart d'avertissement +
   liste des intercesseurs. Accès réservé.
4. **Planning** — `PlanningViews` (lecture).
5. **Alertes pastorales** — volontaire inactif, nouveau à intégrer, désistements
   fréquents, peu sollicité.
6. **Statistiques d'engagement** — `StatsGlobales`.

---

## E-bis. Vie des STARs (`pastoralvie.jsx`) — desktop (accent `ok` vert)

Nav : **Bien-être des STARs · Charges de service · Multi-départements · Alertes
surcharge (badge)**.

1. **Bien-être** — `Donut` équilibre global + 4 StatTiles (surchargés, peu sollicités,
   multi-départements, total). Carte « STARs en surcharge » (barres + badges).
2. **Charges de service** — tableau STAR × (départements, charge ce mois (barre),
   niveau) trié par charge.
3. **Multi-départements** — grille de cartes (STARs ≥2 départements, badge « À
   surveiller » si charge élevée).
4. **Alertes surcharge** — liste générée des STARs en charge critique.

---

## G. Administrateur (`admin.jsx`) — desktop (accent `#b8556a`)

Nav : **Utilisateurs (badge) · Départements · Rôles · Modèles d'événements ·
Paramètres · Exports · Notifications · Journaux d'actions**.

1. **Utilisateurs** — onglets « Comptes actifs » (tableau) / « En attente » (cartes
   à **Valider/Refuser**). Recherche. « Créer un utilisateur ».
2. **Départements** — grille de tous les départements avec `Toggle` actif/inactif,
   badges (Confidentiel/Pilotage/Standard). « Nouveau département ».
3. **Rôles** — compteurs par rôle global + **matrice** utilisateur × rôle (checks).
   « Attribuer un rôle ».
4. **Modèles d'événements** — grille de modèles (besoins préremplis, toggle actif).
5. **Paramètres** — réglages groupés (Notifications/Planning/Charge) avec
   toggles/nombres/ranges (cf. `PARAMS` dans `03`).
6. **Exports** (`ExportsScreen`) · 7. **Notifications** (`NotifCenter`) ·
   8. **Journaux d'actions** — flux d'audit (pastille tone, user, action, entité, date).

---

## F. Écrans transverses (`transverse.jsx`)

- **`NotifCenter`** — onglets Toutes/Non lues, « Tout marquer comme lu », lignes
  (icône canal, titre + badge canal, message, date, pastille non lu).
- **`ExportsScreen`** — colonne gauche : type d'export (global/événement/département/
  stats) + format (PDF/Excel) + note de confidentialité + « Télécharger ». Colonne
  droite : **aperçu réaliste** (`PdfPreview` mise en page document / `ExcelPreview`
  grille tableur).
- **`EventForm`** — création d'événement : choix d'un modèle (préremplit nom +
  besoins), nom/date/lieu/heures, besoins par département éditables (compteur total),
  actions « Enregistrer en brouillon » / « Enregistrer et générer ».
