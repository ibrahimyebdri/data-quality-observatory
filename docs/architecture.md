# Architecture dynamique

> **Principe de conception :** la qualité n’est pas une valeur décorative. Chaque résultat affiché doit provenir d’un fichier, d’une règle déterministe et d’un run persistant que l’on peut retrouver.

Data Quality Observatory est une application portfolio full-stack. Le frontend public est servi par GitHub Pages, tandis que les opérations qui manipulent des données, exécutent les règles ou lisent l’historique passent par une API distincte. Cette séparation permet de publier l’interface sur GitHub sans faire passer les fichiers CSV, les sessions ou la base de données par un artefact statique.

## Flux de traitement

```text
GitHub Pages / application React
        │  tRPC typé + CORS explicite + cookies de session
        ▼
API Express / tRPC ──► OAuth Manus ──► session de l’API
        │
        ├──► Stockage objet S3 : source CSV
        ├──► Moteur CSV déterministe : profilage et règles
        └──► MySQL / TiDB : datasets, runs, findings, notifications
                                     │
                                     ▼
                     Evidence Ledger : score, preuves, historique, export
```

| Couche | Responsabilité | Éléments vérifiables dans le dépôt |
| --- | --- | --- |
| Frontend | Affiche l’aperçu CSV, l’espace de travail, les résultats et l’historique ; envoie les mutations tRPC. | `client/src/pages/Home.tsx`, `client/src/main.tsx` |
| Authentification | Commence le login sur l’origine API, lie la demande à un nonce et refuse les retours hors liste autorisée. | `client/src/const.ts`, `server/_core/oauth.ts`, `server/_core/oauthRedirect.ts` |
| API | Expose `quality.overview`, `quality.importCsv` et `quality.markNotificationRead` ; les actions d’écriture exigent une session. | `server/routers.ts` |
| Moteur de qualité | Analyse un contenu CSV et calcule les métriques, dimensions et findings de manière déterministe. | `server/quality-engine.ts` |
| Persistance | Conserve le dataset, le run, les findings et les alertes ; la source CSV est stockée séparément. | `server/quality-db.ts`, `drizzle/schema.ts`, `server/storage.ts` |
| Publication | GitHub Actions compile le frontend avec l’URL de l’API distante et le déploie sur GitHub Pages. | `.github/workflows/pages.yml` |

## Contrat de données et moteur de règles

L’import accepte un fichier CSV avec une ligne d’en-tête et une taille maximale de 2 MB dans cette version publique. Les règles ne corrigent pas silencieusement les valeurs. Elles signalent les champs manquants, les identifiants en double, les emails ou dates invalides, les codes de référence incohérents et les signaux de fraîcheur lorsque les colonnes pertinentes existent. Chaque résultat contient un statut, un champ, un nombre de lignes concernées et un message lisible.

Le bouton **Example** n’active pas un tableau simulé. Il affiche le contenu exact d’un fichier CSV synthétique, téléchargeable et conçu pour provoquer plusieurs règles. Une fois la session ouverte, **Run example through checks** appelle la même mutation `quality.importCsv` qu’un fichier choisi par l’utilisateur. Le run est donc traité, persisté et exporté par le même chemin applicatif.

## Décisions et compromis

| Décision | Motif | Compromis assumé |
| --- | --- | --- |
| Frontend GitHub Pages + API séparée | Le dépôt offre un lien public GitHub sans transformer les écritures en données locales simulées. | Une session entre deux origines dépend des politiques de cookies du navigateur ; le parcours est explicitement testé dans un navigateur connecté. |
| Règles déterministes et limitées | Les findings restent lisibles, testables et faciles à relier au CSV. | Ce n’est pas un moteur de validation de schéma exhaustif ni un remplaçant d’une plateforme spécialisée. |
| Stockage objet pour les sources | Les fichiers ne gonflent pas les tables relationnelles, qui restent consacrées aux métadonnées et résultats. | Les droits de rétention et de purge ne sont pas encore configurables par utilisateur. |
| Import protégé | Les fichiers, l’historique et les alertes ne sont pas exposés anonymement. | Le visiteur doit se connecter pour créer et consulter son propre run persistant. |

## Limites connues et prochaines évolutions

Cette version est volontairement cadrée comme démonstration technique. Elle ne prend pas encore en charge les fichiers XLSX, les CSV de plus de 2 MB, les règles définies par l’utilisateur, la planification, les connecteurs de warehouse ou une gestion collaborative des rôles. Pour un usage de production, les évolutions prioritaires seraient un contrat de schéma versionné, une zone de quarantaine, des seuils par domaine, la planification des contrôles, une politique de rétention et des connecteurs vers les sources analytiques.

La vérification manuelle restante concerne le parcours entièrement authentifié depuis GitHub Pages : import, persistance, navigation mobile et export du même run. La suite de tests couvre déjà le moteur, le contrat d’exemple, les routes protégées, les redirections OAuth autorisées et les destinations de navigation ; le journal exact est conservé dans [`docs/verification.md`](verification.md).
