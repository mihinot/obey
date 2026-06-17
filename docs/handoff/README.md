# Handoff — OBEY · Plateforme de gestion du service

> Package de transmission pour finaliser l'application avec Claude Code.
> _OBEY — « Disponibles pour Servir avec Amour »_

---

## 1. Vue d'ensemble

**OBEY** est une plateforme de gestion des volontaires (« STARs ») et de génération
automatique de plannings de service pour une église multi-départements.

L'application couvre **6 espaces** correspondant à 6 rôles, plus un flux
d'authentification :

| Espace | Vue | Rôle |
|---|---|---|
| **Espace STAR** | Mobile | Le volontaire : voit son planning, confirme sa présence, déclare ses indisponibilités, se désiste |
| **Référent** | Desktop | Pilote **un** département : génère/valide les plannings, gère son équipe, traite les remplacements |
| **Coordination Générale** | Desktop | Vue **globale** tous départements : validation/publication, statistiques, exports |
| **Corps Pastoral** | Desktop | Suivi **spirituel** (baptême, formations, Familles d'Impact) + département confidentiel Intercession |
| **Vie des STARs** | Desktop | Veille sur l'**équilibre de charge** : surcharges, multi-départements, bien-être |
| **Administrateur** | Desktop | Système : comptes, départements, rôles, modèles d'événements, paramètres, journaux d'audit |

Le cœur fonctionnel est un **moteur de génération de planning** qui, pour un
événement donné, classe les STARs disponibles par **score** (disponibilité,
appartenance au département, charge, fiabilité, conflits) et propose une
affectation par département. Voir `04_PLANNING_ENGINE.md`.

---

## 2. À propos des fichiers de design

Les fichiers de `source_prototype/` sont des **références de design réalisées en
HTML/React (via Babel in-browser)**. Ce sont des **prototypes** qui montrent
l'apparence et le comportement voulus — **pas du code de production à copier tel
quel**.

La tâche consiste à **recréer ces écrans dans l'environnement cible** en
utilisant ses patterns et librairies établis. Si aucun environnement n'existe
encore, choisir la stack la plus adaptée (recommandation au §5) et y implémenter
les designs.

Le prototype tourne entièrement **en mémoire** : toutes les données sont fictives
(`data.jsx`, `data2.jsx`), aucune persistance ni API. La seule persistance est
`localStorage` pour mémoriser l'espace/écran courant en démo — à remplacer par
un vrai routeur + backend.

---

## 3. Fidélité : **HAUTE (hi-fi)**

Ces maquettes sont **haute-fidélité** : couleurs, typographie, espacements,
rayons, ombres et interactions sont définitifs. Recréez l'UI **au pixel près**
avec les librairies de la codebase cible. Tous les tokens exacts sont dans
`01_DESIGN_TOKENS.md`.

---

## 4. Comment lire ce package

| Document | Contenu |
|---|---|
| **README.md** | Ce fichier — vue d'ensemble, stack recommandée, feuille de route |
| **01_DESIGN_TOKENS.md** | Couleurs, typographie, espacements, rayons, ombres, animations, icônes |
| **02_COMPONENTS.md** | Bibliothèque de composants partagés (Btn, Badge, Card, Avatar, charts, shells…) |
| **03_DATA_MODEL.md** | Entités (STAR, Département, Événement, Affectation, Compte…) et leurs champs |
| **04_PLANNING_ENGINE.md** | Algorithme de scoring & génération — **spécification exacte** |
| **05_SCREENS.md** | Chaque écran des 6 espaces + auth : layout, composants, copy, interactions |
| **06_ROLES_PERMISSIONS.md** | Modèle de rôles, permissions, règles de confidentialité |
| **CLAUDE.md** | À **copier à la racine du futur repo** — guide Claude Code (produit, règles métier, tokens, ordre d'implémentation) |
| **screenshots/** | Rendu de référence de chaque espace (voir §8) |
| **source_prototype/** | Le code source du prototype (HTML + JSX) |

> **CLAUDE.md** : ce fichier est destiné à la **racine du dépôt de production**.
> Il référence le package sous `docs/handoff/` — ajuste les chemins si tu ranges
> le package ailleurs.

---

## 8. Captures de référence (`screenshots/`)

| Fichier | Écran |
|---|---|
| `01-auth-connexion.png` | Authentification — connexion |
| `02-star-accueil-mobile.png` | Espace STAR (mobile) — accueil |
| `03-referent-dashboard.png` | Référent — tableau de bord |
| `04-referent-planning.png` | Référent — planning (vue liste) |
| `05-referent-generation-engine.png` | **Moteur de génération — résultats scorés** |
| `06-coordination-dashboard.png` | Coordination — tableau de bord global |
| `07-coordination-statistiques.png` | Coordination — statistiques |
| `08-pastoral-vue-globale.png` | Corps Pastoral — vue globale |
| `09-pastoral-suivi-confidentiel.png` | Corps Pastoral — suivi (confidentiel) |
| `10-vie-bienetre.png` | Vie des STARs — bien-être |
| `11-admin-utilisateurs.png` | Administrateur — utilisateurs |
| `12-admin-exports.png` | Administrateur — exports (aperçu PDF/Excel) |

---

## 5. Stack recommandée (si aucune n'existe)

Le prototype est en React. Suggestion pour la production :

- **Frontend** : React + TypeScript, Vite. Router : React Router. État serveur :
  TanStack Query. UI : recréer la lib de primitives décrite dans `02_COMPONENTS.md`
  (ou l'adosser à Radix/shadcn en réappliquant les tokens).
- **Mobile (Espace STAR)** : l'espace STAR est pensé mobile-first (largeur max
  440 px, tab bar basse). Peut être un PWA responsive ou React Native — la même
  API le sert.
- **Backend** : API REST/GraphQL (Node/NestJS, Django ou autre selon l'équipe).
  Auth par email/mot de passe + OAuth Google. Validation de comptes par admin.
- **Notifications** : canaux Interne / Email / WhatsApp (voir paramètres admin).
- **Exports** : génération PDF + Excel côté serveur (voir écran Exports).

> ⚠️ **Indépendamment de la stack**, respectez les **règles métier** des §§
> 04 et 06 : elles ne sont pas négociables (scoring, seuils de charge, délai de
> désistement J-7, confidentialité du département Intercession).

---

## 6. Feuille de route suggérée

1. **Fondations** — Mettre en place les design tokens (`01`) et la bibliothèque
   de composants (`02`) dans l'environnement cible. Polices : **Outfit** (display)
   + **Figtree** (texte) via Google Fonts.
2. **Modèle de données & API** — Implémenter les entités (`03`) et les endpoints
   (liste suggérée ci-dessous). Seed avec les données fictives pour parité visuelle.
3. **Auth & rôles** — Connexion / inscription / mot de passe oublié / compte en
   attente. Modèle de permissions (`06`).
4. **Moteur de planning** — Porter l'algorithme de scoring (`04`) **côté serveur**.
   C'est la pièce maîtresse : à tester unitairement contre les cas du prototype.
5. **Espaces** — Implémenter écran par écran (`05`), en commençant par Référent
   (génération) et STAR (confirmation), qui forment la boucle de valeur centrale.
6. **Transverses** — Notifications, Exports, Statistiques, Journaux d'audit.

### Endpoints d'API suggérés (non exhaustif)

```
POST   /auth/login            POST /auth/register      POST /auth/forgot-password
GET    /me                    (profil + rôles + espaces accessibles)

GET    /stars                 GET  /stars/:id          PATCH /stars/:id
GET    /departments           POST /departments        PATCH /departments/:code
GET    /events                POST /events             PATCH /events/:id
POST   /events/:id/generate   → renvoie le classement scoré par département
POST   /events/:id/validate   POST /events/:id/publish

GET    /assignments?event=    PATCH /assignments/:id   (confirmer / désister)
POST   /substitutions         PATCH /substitutions/:id/validate

GET    /me/availabilities     POST /me/availabilities  DELETE /me/availabilities/:id
GET    /notifications         POST /notifications/read-all

GET    /accounts/pending      POST /accounts/:id/approve   POST /accounts/:id/reject
GET    /roles                 POST /roles/assign
GET    /templates             GET  /params             PATCH /params/:key
GET    /audit-log
GET    /stats/coverage  /stats/load  /stats/engagement
GET    /exports?type=&format= (PDF / Excel)
```

---

## 7. Notes importantes

- **Confidentialité** : le département **Intercession** et les **données
  pastorales** (baptême, formations) sont exclus des vues globales, exports
  standards et statistiques publiques. Accès réservé au Corps Pastoral. Voir `06`.
- **Délai de désistement** : un STAR ne peut se désister seul que jusqu'à **J-7**.
  Au-delà → message l'invitant à contacter son référent. Paramétrable (admin).
- **Seuils de charge** : Disponible (≤1) / Normale (2–3) / Élevée (4–6) /
  Critique (>6). Pilotent le scoring et les alertes. Paramétrables (admin).
- **Le prototype s'ouvre** sur un sélecteur d'espaces (démo). Un bouton flottant
  « Démo · naviguer » (bas-gauche) permet de sauter entre espaces — **à retirer
  en production** (c'est un artefact de démo, pas une feature).
- Les **données sont fictives** (noms, emails en `@obey.church`). À remplacer.
