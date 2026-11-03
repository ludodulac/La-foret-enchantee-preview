# STUDIO AUDIO — Prévisualisation isolée (doublage synchronisé, 3 novembre 2026)

Source : `ludodulac/La-foret-enchantee` / commit `f9ca8ded24e0fe57241fee1a477dd02b6ad7e05a` ; PR #46 DRAFT. Production inchangée.

## Correction du doublage
Le moteur précédent démarrait la prise WAV, puis lançait la lecture de la piste 1 après un décodage asynchrone. Sur mobile, l'accompagnement arrivait trop tard, entraînant une deuxième voix décalée.

Maintenant, le Studio décode **avant d'acquérir le microphone**, puis lance les pistes existantes et la capture dans le **même tour d'exécution**. STOP annule aussi la préparation avant l'ouverture du microphone. Les prises précédentes sont conservées mais ne sont **pas repositionnées automatiquement**.

Pendant un doublage, privilégie un **casque filaire** : le haut-parleur peut être capté par le microphone et le Bluetooth peut ajouter sa propre latence.

## Vérifications
CI du dépôt de développement :
- 036 : simulateur avec **1 250 ms de décodage** avant ouverture micro ; source audio et prise déclenchées dans le même tour, sans décalage asynchrone.
- 037 : véritable source de pulsations WAV + réaction vocale synthétique enregistrée dans OPFS. Réponse attendue à +0,28 s ; test obtenait +0,305 s (tolérance de test ±0,17 s). Ne représente **pas** une mesure de latence du Redmi réel.
- 029–033 : capture, gestion du microphone, multi-pistes, sauvegarde, lecture et export.

Cette prévisualisation ne se connecte pas à Supabase ; publication externe, sonothèque distante et nettoyage désactivés. Les fichiers de test restent isolés sous IndexedDB `foret-studio-preview-046` et OPFS `studio-wav-preview-046`. Ne jamais effacer les données Brave sans exporter les prises.
