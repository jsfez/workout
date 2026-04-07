# Workout

Application React pour suivre un programme de musculation sur 8 semaines, avec progression par séance, saisie des charges et reprise de la dernière charge connue.

## Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS 4
- Lucide React pour les icônes

## Développement

```bash
npm install
npm run dev
```

## Scripts

```bash
npm run dev      # serveur de développement
npm run build    # vérification TypeScript + build Vite
npm run lint     # lint ESLint
npm run preview  # prévisualisation du build
```

## Design System

Les tokens de couleurs et de typographie vivent dans `tailwind.config.ts`.
Le light mode et le dark mode partagent les mêmes classes Tailwind ; seules les valeurs des tokens changent selon la classe `dark` sur `html`.

Les composants doivent utiliser les classes Tailwind sémantiques du projet, par exemple :

- `bg-background`
- `bg-surface`, `bg-surface-raised`, `bg-surface-muted`, `bg-surface-hover`
- `border-border`
- `text-text`, `text-text-muted`, `text-text-subtle`, `text-text-faint`
- `bg-primary`, `text-primary-light`, `text-primary-foreground`
- `bg-success`, `text-success-foreground`
- `bg-warning`, `text-warning-foreground`
- `bg-danger`, `text-danger-foreground`

`src/index.css` ne contient que l’import Tailwind, le lien vers la config et les styles globaux indispensables.

## Navigation

Les exercices s’ouvrent dans une page dédiée, pas dans une modale.

Gestes tactiles :

- swipe gauche depuis l’accueil : ouvrir la prochaine séance
- swipe gauche depuis une séance : ouvrir le premier exercice à renseigner
- swipe droite depuis une séance : revenir à l’accueil
- swipe gauche/droite depuis un exercice : passer à l’exercice suivant/précédent
