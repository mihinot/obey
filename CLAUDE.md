# OBEY — Documentation projet

OBEY est une plateforme de gestion des bénévoles de service (appelés **STARs**) pour une église. Elle couvre la planification des événements, l'affectation des STARs par département, le suivi de la fiabilité, et la coordination générale.

---

## Architecture

Monorepo npm workspaces avec deux applications :

```
apps/
  api/    Express + Prisma + TypeScript  (port 3000)
  web/    React + Vite + TypeScript      (port 5173)
```

### Stack technique
- **API** : Express 5, Prisma ORM, PostgreSQL, JWT (access 15min + refresh 7j), bcryptjs, nodemailer
- **Web** : React 18, React Router v6, Vite, TypeScript strict
- **Auth** : JWT stocké en localStorage (`accessToken`, `refreshToken`)
- **Emails** : nodemailer — en dev, log console si `SMTP_HOST` absent

---

## Démarrage

```bash
# Installer les dépendances (racine)
npm install

# Démarrer API + Web en parallèle
npm run dev

# API seule
npm run dev:api

# Web seul
npm run dev:web
```

### Base de données

```bash
cd apps/api

# Appliquer les migrations
npx prisma migrate dev

# Regénérer le client Prisma (après modif schema)
npx prisma generate

# Alimenter la base (comptes de test + données d'exemple)
npm run prisma:seed
```

---

## Comptes de test (après seed)

| Email | Mot de passe | Rôle |
|---|---|---|
| `admin@obey.app` | `admin1234` | ADMINISTRATEUR + COORDINATION_GENERALE |
| `referent.acc@obey.app` | `referent1234` | REFERENT (dept ACC) + STAR |
| `sophie.martin@obey.app` | `star1234` | STAR |
| *(autres STARs)* | `star1234` | STAR |

---

## Rôles RBAC

| Rôle | Espace | Périmètre |
|---|---|---|
| `ADMINISTRATEUR` | `/admin` | Accès total, gestion users/rôles/paramètres |
| `COORDINATION_GENERALE` | `/coordination` | Vue globale, validation plannings, exports |
| `REFERENT` | `/referent` | Gestion d'un département (planning, équipe, alertes) |
| `CORPS_PASTORAL` | `/pastoral` | Données spirituelles confidentielles, intercession |
| `VIE_DES_STARS` | `/vie` | Bien-être, charges, alertes sur les bénévoles |
| `STAR` | `/star` | Espace mobile : planning perso, confirmation, indispos |

Le dispatch à la racine `/` redirige automatiquement selon le rôle prioritaire (ADMINISTRATEUR > CORPS_PASTORAL > COORDINATION_GENERALE > VIE_DES_STARS > REFERENT > STAR).

---

## Montage des routes API

```
POST/GET  /auth/*                  authRouter
GET/PATCH /stars/*                 starsRouter
GET/POST  /events/*                eventsRouter + planningRouter (montés tous deux sur /events)
GET/POST  /me/*                    meRouter
GET       /departments/*           departmentsRouter
GET/POST  /admin/*                 adminRouter
GET       /stats/*                 statsRouter
GET       /pastoral/*              pastoralRouter
```

> **Attention** : `planningRouter` est monté sur `/events`, donc les routes d'assignments sont accessibles via `/events/assignments/...` et NON `/assignments/...` ou `/planning/...`.

---

## Conventions critiques

### Statuts (PascalCase strict)

```typescript
// Star.statut
'Nouveau' | 'Actif' | 'Occasionnel' | 'EnPause' | 'Ancien'

// Assignment.statut
'Proposee' | 'Publiee' | 'Confirmee' | 'Desistee'
// ⚠ 'Effectuee' et 'Absente' N'EXISTENT PAS dans le schéma

// Event.statut
'BROUILLON' | 'EN_GENERATION' | 'A_VALIDER' | 'PUBLIE' | 'ANNULE'
```

### Échelles numériques

```typescript
Star.charge  // entier 0–5 (nombre de services actifs), PAS un pourcentage
Star.fiab    // float 0–1 (ex: 0.85 = 85% de fiabilité), PAS 0–100

// Affichage charge en % pour l'UI :
const chargePct = (charge: number) => Math.min(100, charge * 20)
```

### Shape de `/stats/summary`

```typescript
{
  kpis: { totalStars, starsActifs, totalEvents, eventsPublies,
          totalAssignments, confirmes, desistements, desistementsLast30,
          starsSurcharge, tauxConfirmation },
  eventsByMonth: Record<string, number>,   // objet {  "2025-01": 3, ... }, PAS un tableau
  deptStats: { deptCode, total, confirmes, taux }[]  // 'taux' PAS 'tauxConfirmation', 'confirmes' PAS 'actifs'
}
```

### Paramètres de configuration (table `Parameter`)

Clés lues par le moteur de planning :

| `cle` | Type | Valeur par défaut | Description |
|---|---|---|---|
| `charge_elevee_min` | number | 3 | Seuil charge élevée (sur 5) |
| `charge_critique_min` | number | 4 | Seuil charge critique — STAR non proposé |
| `desist_seuil_malus` | number | 3 | Désistements avant malus fiabilité |
| `delai_desist_jours` | number | 7 | Jours avant événement → désistement tardif |
| `NOTIF_EMAIL` | toggle | true | Notifications email |
| `NOTIF_WHATSAPP` | toggle | false | Notifications WhatsApp |

---

## Moteur de planning

Fichier : `apps/api/src/planning/engine.ts`

Le moteur score chaque STAR candidat pour un département/événement :

| Critère | Points |
|---|---|
| Disponible (pas d'indispo) | +40 |
| Membre du département | +25 |
| Peu sollicité récemment | +20 |
| Fiabilité élevée | +10 |
| Aucun conflit | +5 |
| Conflit de charge | -20 |
| Charge élevée | -15 |
| Charge critique | -30 |
| Désistements fréquents | -10 |

Flux événement : `BROUILLON → EN_GENERATION → A_VALIDER → PUBLIE → ANNULE`

---

## Dette technique connue

- **OAuth Google** : variables présentes dans `.env.example`, mais aucune route OAuth implémentée dans l'API.
- **WhatsApp (Twilio)** : variables présentes dans `.env.example`, paramètre en base, mais aucun appel Twilio dans le code — le toggle `NOTIF_WHATSAPP` ne fait rien.
- **Recherche globale** : champ présent dans le header (DeskShell) mais non connecté à une API de recherche.
- **Exports PDF** : générés côté client (jsPDF) — fonctionnel mais mise en page basique.

---

## Variables d'environnement

### `apps/api/.env`

Voir `apps/api/.env.example` — variables obligatoires : `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`.

### `apps/web/.env`

Voir `apps/web/.env.example` — variable obligatoire : `VITE_API_URL`.

---

## Tests

```bash
cd apps/api
npm test          # Jest — tests du moteur de planning (engine.test.ts)
```

---

## Branche de développement active

`claude/busy-einstein-dy6y6x` → PR #2 ouverte vers `main`.
