# Studio Audio — essai mobile isolé, sécurité du micro (3 novembre 2026)

Source : `ludodulac/La-foret-enchantee` au commit `b2d6d01594768d3465d8f92914c482f38e66708f`, PR #46 **DRAFT**, production inchangée.

Version d'essai dans `studio.html` : REC WAV/STOP intégrés, progression visible, deux pistes, sauvegarde locale OPFS. Le moteur peut signaler une absence de signal micro, limite l'attente d'ouverture du micro et arrête immédiatement toute prise si le navigateur passe en arrière-plan ; un accès micro accordé après un délai est fermé. Aucun micro n'est nécessaire pour consulter les projets.

Aucun accès Supabase, aucune publication ni effacement d'anciens projets. Le stockage reste isolé dans IndexedDB `foret-studio-preview-046` et OPFS `studio-wav-preview-046` : ne pas effacer les données du navigateur. Les captures d'écran Android peuvent elles-mêmes entrer en conflit avec un enregistrement microphone ; tester un enregistrement vocal sans capture d'écran en cours pour le diagnostic matériel.

La validation CI Chromium utilise un microphone synthétique, et inclut une capture muette, un accès tardif au micro et un basculement en arrière-plan. **Elle ne certifie pas l'accès réel du matériel Android.**
