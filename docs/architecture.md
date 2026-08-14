# Architecture dynamique

> **Principe de conception :** la qualité n’est pas une valeur décorative. Chaque résultat affiché doit provenir d’un fichier, d’une règle déterministe et d’un run persistant que l’on peut retrouver.

Data Quality Observatory est une application portfolio full-stack. GitHub Pages présente une passerelle publique légère, tandis que le workspace fonctionnel est servi depuis un domaine Manus unique. Les opérations qui manipulent des données, exécutent les règles, lisent l’historique ou exportent un rapport restent donc sur la même origine que l’authentification, sans dépendre de cookies inter-domaines sur mobile.

## Flux de traitement

```text
GitHub Pages / passerelle de projet
        │  lien explicite vers le workspace vivant
        ▼
Workspace Manus / React + Express + tRPC ──► OAuth Manus ──► session première partie
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
| Frontend | Le workspace Manus affiche l’aperçu CSV, les résultats et l’historique ; GitHub Pages montre une passerelle sans données applicatives. | `client/src/pages/Home.tsx`, `client/src/pages/GitHubGateway.tsx`, `client/src/main.tsx` |
| Authentification | Commence le login sur l’origine API, lie la demande à un nonce et refuse les retours hors liste autorisée. | `client/src/const.ts`, `server/_core/oauth.ts`, `server/_core/oauthRedirect.ts` |
| API | Expose `quality.overview`, `quality.importCsv` et `quality.markNotificationRead` ; les actions d’écriture exigent une session. | `server/routers.ts` |
| Moteur de qualité | Analyse un contenu CSV et calcule les métriques, dimensions et findings de manière déterministe. | `server/quality-engine.ts` |
| Persistance | Conserve le dataset, le run, les findings et les alertes ; la source CSV est stockée séparément. | `server/quality-db.ts`, `drizzle/schema.ts`, `server/storage.ts` |
| Publication | GitHub Actions déploie la passerelle sur GitHub Pages ; l’application active est déployée sur Manus. | `.github/workflows/pages.yml`, `client/src/lib/runtimeHost.ts` |

## Contrat de données et moteur de règles

L’import accepte un fichier CSV avec une ligne d’en-tête et une taille maximale de 2 MB dans cette version publique. Les règles ne corrigent pas silencieusement les valeurs. Elles signalent les champs manquants, les identifiants en double, les emails ou dates invalides, les codes de référence incohérents et les signaux de fraîcheur lorsque les colonnes pertinentes existent. Chaque résultat contient un statut, un champ, un nombre de lignes concernées et un message lisible.

Le bouton **Example** n’active pas un tableau simulé. Il affiche le contenu exact d’un fichier CSV synthétique, téléchargeable et conçu pour provoquer plusieurs règles. Une fois la session ouverte, **Run example through checks** appelle la même mutation `quality.importCsv` qu’un fichier choisi par l’utilisateur. Le run est donc traité, persisté et exporté par le même chemin applicatif.

## Décisions et compromis

| Décision | Motif | Compromis assumé |
| --- | --- | --- |
| Passerelle GitHub Pages + workspace Manus unique | Le dépôt conserve un lien public GitHub, tandis que les fonctions d’écriture restent sur une origine unique et une session première partie. | GitHub Pages n’est plus un second client métier ; il redirige explicitement vers le workspace vivant. |
| Règles déterministes et limitées | Les findings restent lisibles, testables et faciles à relier au CSV. | Ce n’est pas un moteur de validation de schéma exhaustif ni un remplaçant d’une plateforme spécialisée. |
| Stockage objet pour les sources | Les fichiers ne gonflent pas les tables relationnelles, qui restent consacrées aux métadonnées et résultats. | Les droits de rétention et de purge ne sont pas encore configurables par utilisateur. |
| Import protégé | Les fichiers, l’historique et les alertes ne sont pas exposés anonymement. | Le visiteur doit se connecter pour créer et consulter son propre run persistant. |

## Limites connues et prochaines évolutions

Cette version est volontairement cadrée comme démonstration technique. Elle ne prend pas encore en charge les fichiers XLSX, les CSV de plus de 2 MB, les règles définies par l’utilisateur, la planification, les connecteurs de warehouse ou une gestion collaborative des rôles. Pour un usage de production, les évolutions prioritaires seraient un contrat de schéma versionné, une zone de quarantaine, des seuils par domaine, la planification des contrôles, une politique de rétention et des connecteurs vers les sources analytiques.

La vérification manuelle restante concerne le parcours entièrement authentifié depuis le workspace Manus : import, persistance, navigation mobile et export du même run. La suite de tests couvre déjà le moteur, le contrat d’exemple, les routes protégées, les redirections OAuth autorisées et les destinations de navigation ; le journal exact est conservé dans [`docs/verification.md`](verification.md).
