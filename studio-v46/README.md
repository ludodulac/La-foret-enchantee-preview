# Studio audio — preview isolée, vérification du 3 novembre 2026

Source : `ludodulac/La-foret-enchantee` commit `9c00cd1ecd90ad5cd8867be3759e477280d4a8c9` (PR #46 DRAFT).

Enregistrement WAV par le bouton REC WAV et arrêt ■ directement dans l'éditeur, avec curseur et forme d'onde rouge visibles pendant la prise. Lecture manuelle bloquée pendant l'enregistrement. À l'arrêt, sauvegarde WAV fragmentée et insertion automatique sur la piste armée. Menu MES PRISES WAV pour récupération uniquement.

Sur le dépôt de preview, aucun accès à Supabase, aucune publication, aucun identifiant réel ; stockage expérimental local séparé des autres versions (IndexedDB `foret-studio-preview-046`, OPFS `studio-wav-preview-046`). Les prises ne sont pas garanties si les données Brave sont effacées. Aucun changement de la production.

Vérifications CI réalisées : rendu mobile Chromium avec vraie API WebAudio + source micro synthétique, progression visible et waveform non vide, deux prises sur deux pistes, sauvegarde/réouverture, lecture, export WAV complet et Opus. Le test matériel réel Redmi/Brave reste distinct des simulations.
