# STUDIO Audio — preview 046 isolée (2 novembre 2026)

Source: `ludodulac/La-foret-enchantee` au commit `a769cfa3caba8bba44bd2020736d1f1ac06a0c79` (PR #46 DRAFT).

Fichier d'entrée: `studio.html`.

Seules les fonctions locales sont disponibles: enregistrement WAV par AudioWorklet, stockage OPFS, montage multipiste, sauvegarde IndexedDB, mixage WAV, encodage Ogg Opus. Aucun identifiant ou accès Supabase; sonothèque distante, publication et nettoyage de temporaires désactivés.

**Isolation**: `foret-studio-preview-046` dans IndexedDB et `studio-wav-preview-046` dans OPFS, pour ne pas réutiliser les prises/projets des précédentes prévisualisations. Le code reste dans ce dossier et ne modifie ni `index.html` ni `studio.html` racine du dépôt de preview. Production `ludodulac/La-foret-enchantee` inchangée, PR #46 toujours DRAFT.

Cible: tests humains 15 secondes avec Redmi/Brave, puis lecture, coupe, sauvegarde, retour, export local. Aucun essai réel de téléphone n'est certifié par les tests CI.
