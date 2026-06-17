# 01 — Design Tokens

Thème **« Lumière »** : chaleureux & communautaire, dominante violet/mauve.
Source : `source_prototype/theme.jsx` (objet `T`).

---

## Couleurs

### Fonds & surfaces
| Token | Hex | Usage |
|---|---|---|
| `bg` | `#f6f2fb` | Fond d'application (mauve très pâle) |
| `bgWarm` | `#faf7fd` | Fond alternatif tiède (zone scrollable mobile, inputs) |
| `surface` | `#ffffff` | Cartes, panneaux, header |
| `surfaceAlt` | `#f1eafb` | Fonds de tabs, en-têtes de tableaux, pistes de progress |

### Texte
| Token | Hex | Usage |
|---|---|---|
| `ink` | `#2c2535` | Texte principal |
| `sub` | `#6c6379` | Texte secondaire |
| `muted` | `#a096ad` | Texte tertiaire / placeholders |

### Primaire (violet)
| Token | Hex | Usage |
|---|---|---|
| `primary` | `#7c5cd6` | Couleur de marque, boutons, actifs |
| `primaryDeep` | `#5b3fb0` | Texte sur fond clair, dégradés |
| `primarySoft` | `#efe7fb` | Fonds d'état actif/sélection |
| `primaryTint` | `#f6f1fd` | Fond très léger (encart département, notif non lue) |

### Accent & sémantique
| Token | Hex | Soft | Usage |
|---|---|---|---|
| `accent` | `#c97fb0` | `accentSoft #fbecf4` | Rose — Espace STAR, Corps Pastoral |
| `ok` | `#4fa57e` | `okSoft #eaf6f0` | Succès, couverture complète, Vie des STARs |
| `warn` | `#cf9a4a` | `warnSoft #faf0df` | Attention, charge élevée |
| `danger` | `#d76a76` | `dangerSoft #fbecee` | Erreur, surcharge, poste non couvert |
| `border` | `#ece3f6` | — | Bordures d'inputs, séparateurs |
| `borderSoft` | `#f4eefb` | — | Bordures de cartes, lignes de tableaux |

### Accents par espace (couleur de thème de la coquille desktop)
| Espace | Accent |
|---|---|
| Référent | `#7c5cd6` (primary) |
| Coordination | `#7c5cd6` (primary) |
| Corps Pastoral | `#c97fb0` (accent) |
| Vie des STARs | `#4fa57e` (ok) |
| Administrateur | `#b8556a` (rouge brique — défini localement dans `admin.jsx`) |

### Couleurs de départements
| Code | Nom | Couleur |
|---|---|---|
| ACC | Accueil | `#7c5cd6` |
| SEC | Sécurité | `#6f8fd0` |
| PRO | Protocole | `#c08a5a` |
| LOU | Louange & Adoration | `#c97fb0` |
| PRI | Prière | `#5fae9a` |
| COM | Communication / Multimédia | `#5b7fb0` |
| INT | Intercession (confidentiel) | `#8a6fb0` |
| _autres_ | (voir `data2.jsx` DEPARTMENTS_ALL) | `#9a8fb0` par défaut |

> Le violet « confidentiel » `#8a6fb0` est utilisé pour tous les marqueurs de
> confidentialité (badge, encarts Intercession).

---

## Typographie

Deux familles Google Fonts :
- **Display** : `Outfit` — titres, chiffres, wordmark. Poids 600 (titres),
  700 (chiffres/KPI), **800** (wordmark « OBEY »).
- **Texte** : `Figtree` — corps, labels, boutons. Poids 400/500/600/700.

Import (déjà dans `obey.html`) :
```html
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Figtree:wght@400;500;600;700&display=swap" rel="stylesheet">
```

### Échelle de taille (px) observée
| Rôle | Taille | Famille / poids |
|---|---|---|
| Wordmark | 22–40 | Outfit 800, letter-spacing −0.01em |
| Titre de page (`PageHead`) | 25 | Outfit 600, letter-spacing −0.01em |
| Titre de section | 16–24 | Outfit 600 |
| KPI / gros chiffre | 22–28 | Outfit 700, line-height 1 |
| Card titre | 14.5–17 | Outfit/Figtree 600 |
| Corps | 13.5–14 | Figtree 400–500 |
| Secondaire | 12–13 | Figtree, couleur `sub` |
| Label / méta | 11–12.5 | Figtree 600, souvent uppercase + letter-spacing 0.04–0.06em |
| Badge | 12 | Figtree 600 |

---

## Espacements & rayons

- **Rayons** : `radiusSm 10` · `radius 16` · `radiusLg 24` · `pill 999`.
  Cartes = `radiusLg` (24), boutons/inputs = `radius` (16), badges/tabs = pill.
- **Gaps** courants : 6, 8, 10, 12, 14, 16, 20 px (flex/grid `gap`).
- **Padding cartes** : 14–28 px selon densité (défaut 18).
- **Padding contenu desktop** : `26px 28px 40px` (zone `main`).
- **Largeur sidebar desktop** : 248–250 px. **Largeur max mobile** : 440 px.

## Ombres
| Token | Valeur |
|---|---|
| `shadowSm` | `0 4px 14px rgba(96,64,160,0.08)` |
| `shadow` | `0 12px 32px rgba(96,64,160,0.12)` |
| `shadowLg` | `0 24px 60px rgba(72,44,130,0.20)` |

Les ombres sont **teintées violet** (pas de noir neutre) — important pour le rendu « Lumière ».

---

## Animations (CSS)

Définies dans `theme.jsx`, classes utilitaires :
| Classe | Effet | Durée / easing |
|---|---|---|
| `.ob-fade` | translateY(6px)→0 | .35s ease |
| `.ob-rise` | translateY(14px)→0 | .45s cubic-bezier(.2,.8,.3,1) |
| `.ob-scalein` | scale(.97)→1 | .3s cubic-bezier(.2,.8,.3,1) |
| `.ob-pop` | pulse scale 1.12 | .9s ease-in-out |
| `.ob-press` | scale(.97) à `:active` | .12s — feedback tactile sur tous les boutons |
| `.ob-hov` | transition bg/border/shadow | .15–.2s — cartes cliquables |

- `prefers-reduced-motion: reduce` désactive `ob-fade/rise/scalein`.
- Transitions de données : progress bars & donuts `width/stroke-dashoffset .6–.8s cubic-bezier(.2,.8,.3,1)`.
- **Moteur de génération** : animation séquentielle d'étapes (spinner → check),
  ~520 ms par étape. Voir `04_PLANNING_ENGINE.md`.

---

## Icônes

Jeu d'icônes **stroke** custom (SVG 24×24, `stroke-width` 2, linecap/linejoin round)
défini dans `theme.jsx` (objet `ICONS`). Noms utilisés :
`home, calendar, bell, user, users, check, clock, alert, plus, chevR, chevL,
chevD, x, grid, list, spark, bolt, swap, logout, settings, doc, heart, shield,
pin, layers, search, filter, star, dl`.

> En production, on peut remplacer par **Lucide** (style identique, stroke 2,
> round) — la correspondance des noms est quasi 1:1.
