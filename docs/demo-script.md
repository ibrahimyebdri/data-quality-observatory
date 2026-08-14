# Data Quality Observatory — Script de démonstration recruteur

Ce script est prévu pour une vidéo d’environ deux minutes, enregistrée en anglais afin d’être compréhensible par un recruteur international. Il ne faut pas présenter les données d’exemple comme des données clientes : elles sont synthétiques et visibles dans l’interface.

| Séquence | Durée cible | Écran à montrer | Voix off en anglais |
| --- | ---: | --- | --- |
| Introduction | 0:00–0:15 | Page GitHub et lien public du projet | “Hi, I’m Ibrahim Yebdri, a Master’s student focused on Data Engineering and Cloud. This project is Data Quality Observatory: a small full-stack application that makes CSV quality checks explicit, persistent and reviewable.” |
| Problème | 0:15–0:32 | Écran d’accueil et promesse « Quality is a claim » | “The goal is not to decorate a dashboard with a score. A quality score should be backed by source data, deterministic rules and evidence that another person can inspect.” |
| Jeu d’essai | 0:32–0:58 | Bouton **Example**, aperçu du CSV, signaux attendus | “Before uploading anything, the application provides a synthetic customer dataset. You can inspect all six rows, download the CSV, and see why it is expected to fail: duplicate identifiers, missing values, malformed fields and inconsistent codes.” |
| Exécution réelle | 0:58–1:25 | Connexion, bouton **Run example through checks**, puis résultat | “After sign-in, the example uses the same protected import path as a user file. The API stores the source, runs deterministic profiling rules, creates a quality run, and persists individual findings and notifications.” |
| Preuve et historique | 1:25–1:48 | Score, résultats de règles, historique, export | “The workspace exposes the quality score and every rule outcome. The run history is stored in a relational database, and the current report can be exported. This makes the result reproducible instead of a static mock-up.” |
| Architecture | 1:48–2:07 | `docs/architecture.md` ou schéma du README | “The frontend is hosted on GitHub Pages. It talks to a separate API through typed tRPC calls, explicit credentialed CORS, OAuth sign-in, object storage for CSV sources, and a relational store for runs and findings.” |
| Conclusion | 2:07–2:20 | Dépôt GitHub et README | “I built this project to demonstrate practical thinking about data contracts, quality controls and traceability. The repository includes the implementation, test suite and architecture decisions. Thank you for watching.” |

## Préparation d’enregistrement

Enregistrez d’abord une session authentifiée dans le navigateur, puis lancez **Example** et conservez l’aperçu ouvert. Exécutez le jeu d’essai une seule fois ; cela évite de surcharger inutilement l’historique. Avant l’enregistrement, vérifiez que l’historique, les résultats de règles et l’export concernent bien le même run que l’exemple montré au début de la vidéo.

La vidéo doit montrer l’interface telle qu’elle est, y compris l’étiquette indiquant que le jeu d’essai est synthétique. Ne promettez ni usage client, ni conformité réglementaire, ni fonctions non présentes dans le dépôt.
