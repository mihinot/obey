# 04 — Moteur de génération de planning

**Pièce maîtresse de l'application.** Pour un événement, le moteur classe les STARs
par score et propose une affectation par département. Source : `data.jsx`
(`evaluerCandidat`, `genererDept`, `genererPlanning`) ; UI : `planning.jsx`
(`GenerationView`).

> À porter **côté serveur** en production (endpoint `POST /events/:id/generate`).
> Spécification ci-dessous = comportement de référence à reproduire à l'identique
> et à couvrir par des tests unitaires.

---

## 1. Scoring d'un candidat — `evaluerCandidat(star, ctx)`

`ctx = { deptCode, eventDate, dejaAffecteAutreDept }`. Le score démarre à **0**.
Chaque règle ajoute/retire des points et **journalise un `breakdown`** (label + pts)
affiché dans l'UI (« détail du score »).

### Bonus
| Règle | Condition | Points |
|---|---|---|
| Disponible | `eventDate` ∉ `star.indispos` | **+40** |
| Membre du département | `deptCode` ∈ `star.depts` | **+25** |
| Peu sollicité récemment | `star.charge ≤ 1` | **+20** |
| Présence fiable | `star.fiab ≥ 0.85` | **+10** |

### Conflits (un seul, par priorité)
1. `dejaAffecteAutreDept` → **INCOMPATIBLE** « Déjà affecté à un autre département pour cet événement »
2. sinon charge `critique` → **AVERTISSEMENT** « Charge critique ce mois »
3. sinon charge `elevee` → **AVERTISSEMENT** « Charge élevée ce mois »

| Règle | Condition | Points |
|---|---|---|
| Aucun conflit | pas de conflit | **+5** |
| Conflit présent | INCOMPATIBLE ou AVERTISSEMENT | **−20** |

### Malus (cumulables)
| Règle | Condition | Points |
|---|---|---|
| Charge élevée | charge `elevee` | **−15** |
| Charge critique | charge `critique` | **−30** |
| Désistements fréquents | `star.desist ≥ 2` | **−10** |
| Statut occasionnel | `statut === 'Occasionnel'` | **−10** |
| Statut nouveau | `statut === 'Nouveau'` | **−15** |

> ⚠️ Les malus de charge s'**ajoutent** au −20 du conflit d'avertissement (un STAR
> en charge critique cumule −20 conflit et −30 charge). C'est voulu : la charge pénalise fortement.

### Sortie
```
{ star, score, breakdown[], dispo, conflit|null, charge, exclu }
```
`exclu` = vrai si `STATUTS[statut].exclu` (statuts **En pause** / **Ancien**).

---

## 2. Génération pour un département — `genererDept(event, deptCode)`

1. `requis` = `event.besoins[deptCode].requis` (0 si absent).
2. **Candidats** = STARs dont `depts` inclut `deptCode`, évalués par `evaluerCandidat`,
   puis **filtrés** : on retire les `exclu` et les **non disponibles** (`!dispo`),
   puis **triés par score décroissant**.
3. `selectionnes` = `candidats.slice(0, requis)` (les meilleurs).
4. `reserves` = `candidats.slice(requis)` (en attente, repliables dans l'UI).
5. `couverts` = `selectionnes.length` ; `manque` = `max(0, requis − couverts)`.
6. `conflits` = sélectionnés ayant un conflit.
7. `indispos` = nb de STARs du département indisponibles à cette date (pour info).

Retour :
```
{ deptCode, requis, candidats, selectionnes, reserves, couverts, manque, conflits, indispos }
```

`genererPlanning(event)` = `event.besoins.map(b => genererDept(event, b.dept))`.

> Note prototype : `dejaAffecteAutreDept` est câblé à `false` (pas de détection
> inter-départements multi-passes). **En production**, gérer l'affectation globale
> d'un STAR sur l'ensemble des départements d'un même événement (un STAR ne sert
> qu'à un poste par événement) → activer le conflit INCOMPATIBLE.

---

## 3. UI du moteur — `GenerationView` (`planning.jsx`)

Trois phases (`phase` : `intro → running → results`) :

### Phase `intro`
Carte centrée : icône éclair (dégradé primary→primaryDeep), titre « Génération
automatique », texte « Le moteur va analyser N STARs… pour D départements (P postes) »,
puis pastilles des besoins. Bouton **« Lancer la génération »**.

### Phase `running` (animation séquentielle)
6 étapes affichées en liste, **une validée toutes les ~520 ms** (spinner sur
l'étape active → check vert quand faite) :
1. Récupération des besoins de l'événement
2. Chargement des STARs disponibles
3. Exclusion des indisponibles
4. Calcul des scores d'affectation
5. Détection des conflits
6. Génération des propositions

Puis transition (~500 ms) vers `results`. _(En production : remplacer par un vrai
appel API + état de chargement ; conserver l'effet de progression.)_

### Phase `results`
- **4 tuiles de synthèse** : Postes couverts (`couv/requis`), Postes non couverts,
  Conflits détectés, Départements.
- **Une carte par département** (`DeptResult`) : en-tête (pastille couleur + nom +
  badge `couverts/requis` + éventuel « N indispo ») puis :
  - **Sélectionnés** (`CandidateRow`) : Avatar, nom, badge statut, badge conflit
    éventuel, message (conflit ou « Charge … · N services »), **score** (couleur :
    ≥70 ok / ≥45 warn / sinon danger), bouton **« Score »** dépliant le `breakdown`
    ligne par ligne (+/−).
  - **Postes non couverts** : N lignes en pointillés rouges « aucun STAR disponible ».
  - **Réserve** repliable : les candidats hors quota.
- **Barre de validation collante** (bas) : message d'état + actions selon statut :
  - `BROUILLON`/`EN_GENERATION` → **Valider le planning** (→ A_VALIDER)
  - `A_VALIDER` → **Publier le planning** (→ PUBLIE, notifie les STARs)
  - **Régénérer** (relance l'animation) tant que non publié.

---

## 4. Couverture (vues planning) — `couvertureEvt` / `tauxEvt` (`planning.jsx`)

Pour l'affichage des listes/tableaux/calendrier (sans relancer toute la génération) :
- `couvertureEvt(e)` → par département `{ dept, requis, couverts, manque }`.
  _Astuce du proto_ : si l'événement est `PUBLIE`/`A_VALIDER`, `couverts` est borné
  à `requis` (le planning est figé) ; sinon on montre le potentiel brut.
- `tauxEvt(e)` → `{ req, cv, pct }` agrégé tous départements. `pct` pilote la
  couleur : ≥100 ok / ≥60 warn / sinon danger.
