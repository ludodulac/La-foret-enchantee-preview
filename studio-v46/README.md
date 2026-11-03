# Studio Audio — Prévisualisation isolée / sécurité microphone 3 novembre 2026

Cette version reprend la branche DRAFT `ludodulac/La-foret-enchantee` au commit `2517a04dcee4b9816075430ae7749040f6c9de8f` (PR #46, production inchangée). L'interface utilise directement REC WAV / STOP et visualise la forme d'onde.

## Correctifs intégrés
- Réactivation WebAudio au geste REC et accès au stockage avant le microphone.
- Annulation de l'ouverture par STOP ; budget de 9 secondes **au total** pour ouvrir l'enregistrement.
- Si l'autorisation est accordée après l'annulation, le flux reçu tardivement est arrêté.
- Dès STOP, arrêt de toutes les pistes micro **avant** les écritures des WAV. Sauvegarde bornée, fragments récupérables en cas d'échec.
- Passage en arrière-plan : micro arrêté, lecture suspendue, pas de reprise automatique.
- Alerte si Android fournit du silence ; si aucun PCM ne sort du moteur, watchdog et libération automatique au bout de 7 secondes.
- L'ancien enregistreur MediaRecorder reste dans le code comme recours technique, il n'est pas appelé par REC principal.
- Tests automatiques 029 à 033 avec audio synthétique. Ce n'est pas une validation du véritable microphone Redmi.

## Isolation / confidentialité
Aucun accès aux comptes, ni Supabase, ni publication distante ; la sonothèque distante et le nettoyage de données sont désactivés. Projets et prises expérimentaux restent dans IndexedDB `foret-studio-preview-046` et OPFS `studio-wav-preview-046` ; ne pas vider les données Brave sans avoir sauvegardé les sons utiles.

**Pour vérifier réellement le Redmi :** pas d'enregistrement d'écran utilisant le micro en parallèle ; s'appuyer sur le vumètre/forme d'onde et sur la lecture WAV, puis contrôler que la dictée vocale fonctionne normalement. Aucune vidéo supplémentaire n'est demandée.

Recherche détaillée dans `ludodulac/La-foret-enchantee/docs/STUDIO-REC-MICRO-034-ROOT-CAUSE.md`.
