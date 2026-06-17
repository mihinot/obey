# 06 — Rôles, permissions & confidentialité

Ce document formalise les règles d'accès. Elles sont **métier** (pas seulement
cosmétiques) et doivent être appliquées **côté serveur**.

---

## 1. Rôles

### Rôle de base
Tout utilisateur validé est un **STAR** (volontaire) → accès à l'**Espace STAR**
(son planning, ses confirmations, ses indisponibilités, son profil).

### Rôle de département
Un STAR peut être **Référent** (ou adjoint) d'**un département** → accès à l'**Espace
Référent** limité à **son** département (équipe, plannings, remplacements, alertes du
département). Dans le proto : département démo = **Accueil (ACC)**, persona Esther Mbala.

### Rôles globaux (transverses, **cumulables**) — `ROLES_GLOBAUX`
| Rôle | Espace | Portée |
|---|---|---|
| `ADMINISTRATEUR` | Administrateur | Système entier (comptes, départements, rôles, paramètres, audit) |
| `COORDINATION_GENERALE` | Coordination Générale | Tous départements (validation/publication, stats, exports) |
| `CORPS_PASTORAL` | Corps Pastoral | Données spirituelles + département confidentiel Intercession |
| `VIE_DES_STARS` | Vie des STARs | Charges & bien-être de tous les STARs |

> Un même utilisateur peut cumuler plusieurs rôles (ex. Référent **et** membre du
> Corps Pastoral). En production : le `/me` renvoie la liste des espaces accessibles,
> et la navigation s'adapte (le sélecteur d'espace de démo devient un vrai switcher
> filtré sur les droits réels).

---

## 2. Matrice de permissions (synthèse)

| Action | STAR | Référent | Coordination | Pastoral | Vie | Admin |
|---|:--:|:--:|:--:|:--:|:--:|:--:|
| Voir / confirmer **ses** affectations | ✅ | ✅ | ✅ | — | — | — |
| Déclarer ses indisponibilités | ✅ | ✅ | — | — | — | — |
| Se désister (≤ J-7) | ✅ | ✅ | — | — | — | — |
| Générer un planning | — | ✅ (son dept) | ✅ (tous) | — | — | — |
| Valider un planning | — | ✅ (son dept) | ✅ | — | — | — |
| **Publier** un planning | — | (selon org.) | ✅ | — | — | — |
| Créer un événement | — | ✅ | ✅ | — | — | — |
| Gérer une équipe | — | ✅ (son dept) | — | — | — | — |
| Traiter les remplacements | — | ✅ (son dept) | ✅ | — | — | — |
| Voir données pastorales | — | — | — | ✅ | — | — |
| Voir département Intercession | — | — | — | ✅ | — | — |
| Voir charges/bien-être globaux | — | (son dept) | ✅ | ✅ | ✅ | — |
| Stats globales | — | — | ✅ | ✅ | (charge) | — |
| Exports | — | (son dept) | ✅ | (sans confidentiel) | — | ✅ |
| Valider / refuser des comptes | — | — | — | — | — | ✅ |
| Gérer départements / rôles / paramètres | — | — | — | — | — | ✅ |
| Journaux d'audit | — | — | — | — | — | ✅ |

_(« — » = pas d'accès dans le périmètre du prototype ; à arbitrer avec le client si
besoin d'élargir.)_

---

## 3. Confidentialité — règles dures

### Département **Intercession** (`INT`, `confidentiel: true`)
- **Masqué** des vues globales de planning, de la couverture par département
  (Coordination), des statistiques publiques et des **exports standards**.
- Membres, plannings et statistiques visibles **uniquement** par le **Corps Pastoral**
  (et, le cas échéant, les responsables Intercession).
- Tout département peut être marqué confidentiel via le flag `confidentiel` (admin) —
  même traitement.

### Données **pastorales** (sur la fiche STAR)
- `baptise`, `f001`, `f101`, `f201`, `famille`, `disciple` = **confidentielles**.
- Visibles dans l'**Espace Corps Pastoral** (écran « Suivi pastoral ») et sur le
  **profil du STAR lui-même**. **Exclues** des exports standards et des vues des
  autres rôles (Référent, Coordination, Vie, Admin).
- Afficher `ConfidentialBadge` sur tout écran qui les expose.

### Exports
L'écran Exports affiche une **note** : « Le département Intercession et les données
pastorales sont automatiquement exclus des exports standards. » → le backend doit
filtrer ces données des exports, sauf contexte pastoral explicite.

---

## 4. Règles de cycle de vie & garde-fous

- **Délai de désistement** : un STAR se désiste seul **jusqu'à J-7** (paramètre
  `delai_desistement_jours`, défaut 7). Passé ce délai → blocage + invitation à
  contacter référent/adjoint/coordonnateur. À **valider côté serveur** (ne pas se
  fier au front).
- **Validation de compte** : une inscription crée un compte **En attente** ;
  l'utilisateur ne peut se connecter à un espace qu'après **approbation admin**
  (écran « Compte en attente » côté inscrit).
- **Statuts excluants** : les STARs `En pause` / `Ancien` sont **exclus de la
  génération** de planning (cf. `04`).
- **Publication** : passer un planning à `PUBLIE` **notifie les STARs** affectés
  (canal selon paramètres : Interne / Email / WhatsApp).
- **Audit** : toute action sensible (publication, validation compte, génération,
  modification, désistement, création département…) est journalisée (`JOURNAUX`).
