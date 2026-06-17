# 02 — Bibliothèque de composants

Composants partagés du prototype. Source : `theme.jsx` (primitives) +
`shell.jsx` (coquilles & charts). À recréer dans la lib de la codebase cible
en réappliquant les tokens (`01`).

---

## Primitives (`theme.jsx`)

### `Icon({ name, size=20, color='currentColor', stroke=2, style })`
SVG stroke 24×24. Voir liste de noms dans `01_DESIGN_TOKENS.md`.

### `Btn({ variant='primary', size='md', full, icon, onClick, disabled })`
- **Tailles** : `sm` (8×14, 13px) · `md` (11×18, 14.5px) · `lg` (14×24, 16px).
- **Rayon** : 16. Poids 600. `display:inline-flex; gap:8; line-height:1`.
- **Variantes** :
  | variant | fond | texte | extra |
  |---|---|---|---|
  | `primary` | `primary` | #fff | shadowSm |
  | `deep` | `primaryDeep` | #fff | |
  | `soft` | `primarySoft` | `primaryDeep` | |
  | `outline` | `surface` | `ink` | bordure `border` |
  | `ghost` | transparent | `sub` | |
  | `danger` | `danger` | #fff | |
  | `dangerSoft` | `dangerSoft` | `danger` | |
- Icône optionnelle à gauche. Classe `.ob-press` (scale au clic). `disabled` → opacity .5.

### `Badge({ tone='ok', children, dot, icon })`
Pilule `padding 4×10`, font 12/600, `white-space:nowrap`. Paire [texte, fond] par tone :
`ok, warn, danger, primary (→primaryDeep/primarySoft), accent, muted (→sub/surfaceAlt)`.
`dot` = pastille colorée à gauche ; `icon` = petite icône 13px.

### `Dot({ c, s=7 })`
Pastille ronde pleine, couleur `c`, diamètre `s`.

### `Card({ children, pad=18, hover, onClick, style })`
`background:surface; border:1px borderSoft; border-radius:24 (radiusLg); box-shadow:shadowSm`.
`hover` ajoute `.ob-hov` ; `onClick` met `cursor:pointer`.

### `Avatar({ name, size=38, tone })`
Rond avec initiales (2 lettres). Fond = `couleur+'22'`, texte = couleur.
Couleur dérivée du nom via palette `[primary, accent, #6f8fd0, #5fae9a, #c08a5a]`
(index = `name.charCodeAt(0) % 5`), sauf si `tone` fourni. Police Outfit 700.

### `ProgressBar({ value, max, color, height=8, animate })`
Piste `surfaceAlt`, remplissage arrondi, transition width .6s. `animate` rejoue
l'animation `obBar` (depuis 0).

### `Field({ label, value, onChange, type, placeholder, hint, right })`
Label 12.5/600 `sub` au-dessus. Input : bordure `border`, rayon 16, padding 12×14,
14px. **Focus** → bordure `primary` (géré en JS `onFocus/onBlur`). `right` = élément
positionné à droite (ex. icône recherche). `hint` = aide 11.5 `muted` en dessous.

### `SectionTitle({ children, sub, right, size=20 })`
Titre Outfit 600 + sous-titre 13 `sub` optionnel + slot `right` aligné en bas.

### `Wordmark({ size=22, color=primary })`
« OBEY » en Outfit **800**, letter-spacing −0.01em.

### `Tabs({ items, value, onChange })`
Segmented control dans un conteneur pilule `surfaceAlt` (padding 4). Onglet actif :
fond `surface`, texte `primaryDeep`, shadowSm. `items = [{id, label, icon?}]`.

---

## Coquilles & layout (`shell.jsx`)

### `DeskShell({ scope, accent, nav, active, onNav, user, onLogout, onSwitchRole, notifCount, onBell, children })`
**Coquille desktop réutilisable** par Coordination / Pastoral / Vie / Admin.
Layout : `display:flex; min-height:100vh`.
- **Sidebar** (250px, sticky, `surface`, bordure droite) :
  - Wordmark 26 + badge « V1 ».
  - Encart `scope` : fond `accent+'14'`, label `scope.sub` (uppercase 10.5/700 muted)
    + `scope.label` (Outfit 600/16, couleur accent).
  - `nav` : liste de boutons `{id, icon, label, badge?}`. Actif → fond `accent+'1c'`,
    texte accent, poids 600, icône stroke 2.4. `badge` = pastille rouge (compteur).
  - Bas : « Changer de rôle » (icône layers) + « Déconnexion » (icône logout).
- **Header** (sticky, blur, bordure bas) : champ recherche (pilule, max 360px) à
  gauche ; cloche avec compteur `notifCount` + bloc utilisateur (Avatar + nom 13.5/600
  + rôle 11.5 sub) à droite. `onBell` ouvre les notifications.
- **Main** : `padding 26×28×40`, scrollable.

> Le **Référent** a sa propre coquille équivalente (codée dans `referent.jsx`,
> sidebar avec encart « DÉPARTEMENT · Accueil ») — même grammaire visuelle.

### `StatTile({ icon, label, value, sub, color, trend })`
Carte KPI : pastille icône (40×40, fond `color+'18'`), gros chiffre Outfit 700/28,
label 13/600, sous-texte 12 sub. `trend` optionnel = badge.
(`KpiCard` dans `referent.jsx` est une variante identique.)

### `Donut({ value, max, color, size=120, label, sub })`
Anneau SVG (2 cercles, stroke 10, linecap round), transition `stroke-dashoffset .8s`.
Centre : `label` (Outfit 700) + `sub`.

### `BarChart({ data, color, height=130 })`
Barres verticales. `data = [{label, value, color?}]`. Valeur affichée au-dessus,
label dessous. Barre : `border-radius 8px 8px 0 0`, transition height .6s.

### `Toggle({ on, onChange })`
Interrupteur 46×27, pastille blanche glissante, fond `primary` si on.

### `PageHead({ title, sub, right })`
En-tête d'écran desktop : titre Outfit 600/25 + sous-titre + slot `right`
(souvent un `Btn` d'action). `flex-wrap` pour le responsive.

### `ConfidentialBadge()`
Badge « 🛡 Confidentiel » en violet `#8a6fb0` sur fond `#8a6fb015`. À afficher sur
tous les écrans contenant des données pastorales/Intercession.

---

## Toasts
Pattern récurrent : `position:fixed; bottom:28; left:50%; translateX(-50%)`,
fond `ink`, texte blanc, pilule, shadowLg. Auto-dismiss ~2.4–2.6s. (Mobile : `bottom:110`
au-dessus de la tab bar.)

## Tableaux
En-tête `thead` fond `surfaceAlt`, cellules 13×16, labels 12/700 sub. Lignes
séparées par `1px borderSoft`. Conteneur `overflow-x:auto` + `.ob-scroll`
(scrollbar fine violet). Colonne 1 parfois `position:sticky; left:0`.
