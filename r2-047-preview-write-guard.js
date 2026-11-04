/*
 * R2-047 — Preview-only Supabase write guard.
 * ONLY attached to r2-047-admin.html. The public project and Supabase DB are never mutated.
 * Reads: real Supabase SELECT / is_app_admin. Writes: ONLY Worker R2 temporary upload+cleanup.
 */
(function(){
  'use strict';
  const status=document.getElementById('r2-preview-status');
  const authBox=document.getElementById('r2-auth-status');
  function report(message,isError=false) {
    if(status){status.textContent=message;status.style.borderColor=isError?'#c86864':'#547d6a';}
  }
  function safePath(path) {
    return typeof path==='string' && /^r2:(?:contes\/[a-z0-9-]+\.mp3|couvertures\/[a-z0-9-]+\.(?:jpg|jpeg|png|webp))$/i.test(path);
  }
  async function mockInsert(payload) {
    const files=[payload.image_path,payload.audio_path].filter(safePath);
    const info=[
      'Titre : '+payload.title,
      'MP3 : '+(payload.audio_path||'absent'),
      'Couverture : '+(payload.image_path||'aucune')
    ].join('\n');
    try {
      if(!files.length || !safePath(payload.audio_path))throw Error('Le fichier audio ne correspond pas à un envoi R2.');
      report('🕓 Transfert terminé. Vérification de lecture puis suppression des fichiers de test...\n'+info);
      for(const path of files)await window.ForestR2Media.verify(path);
      for(const path of files)await window.ForestR2Media.remove(dbClient,path);
      report('✅ TEST DU VRAI FORMULAIRE RÉUSSI\n'+info+'\n\n✅ MP3 et couverture transférés puis vérifiés.\n✅ Fichiers de test supprimés de Cloudflare.\n✅ Aucune nouvelle histoire créée dans Supabase.\n✅ Aucun changement sur le site public.');
      return {data:{id:-1,...payload},error:null};
    }catch(error) {
      const details='⚠️ Le test n’a pas complètement réussi : '+(error.message||error)+'\n\n'+info+'\nIl peut rester des fichiers de test dans R2 : conserve les chemins affichés et partage-moi seulement le message, pas de clé.';
      report(details,true);
      return {data:null,error:{message:details}};
    }
  }
  // Fail closed: every mutation through Supabase .from() is prohibited, except
  // a deliberately simulated audios.insert() which never reaches Supabase.
  const originalFrom=dbClient.from.bind(dbClient);
  const forbidden=()=>{throw Error('Mode test : toute modification de la base Supabase est interdite.')};
  const wrappedFrom=function(table) {
    if(!['audios','categories','subcategories'].includes(table))throw Error('Lecture indisponible pour cette table dans le test.');
    const query=originalFrom(table);
    return new Proxy(query,{
      get(target,name) {
        if(name==='insert')return table==='audios'?payload=>{
          const result=mockInsert(payload);
          return {then:(ok,fail)=>result.then(ok,fail),select:()=>({single:()=>result})};
        }:forbidden;
        if(['update','upsert','delete'].includes(name))return forbidden;
        const value=target[name];
        return typeof value==='function'?value.bind(target):value;
      }
    });
  };
  dbClient.from=wrappedFrom;
  if(dbClient.from!==wrappedFrom)throw Error('Protection test non installée : opération interdite.');
  // New media always goes through the secured Worker. Old Supabase Storage is read-only.
  const legacyStorageFrom=dbClient.storage.from.bind(dbClient.storage);
  dbClient.storage.from=function(bucket){
    const builder=legacyStorageFrom(bucket);
    return new Proxy(builder,{
      get(target,name){
        if(['upload','update','remove','move','copy'].includes(name))return forbidden;
        const value=target[name];return typeof value==='function'?value.bind(target):value;
      }
    });
  };
  window.ForestR2PreviewReport=report;
  window.requireAuth=async function() {
    try{
      if(!dbClient?.auth?.getSession)throw Error('Client Supabase non chargé');
      const {data,error}=await dbClient.auth.getSession();
      if(error||!data?.session?.access_token)throw Error('Connecte-toi à l’administration de La Forêt Enchantée dans ce navigateur, puis recharge cette page.');
      const rights=await dbClient.rpc('is_app_admin');
      if(rights.error||rights.data!==true)throw Error('Ce compte ne dispose pas des droits d’administration.');
      if(authBox)authBox.textContent='✅ Administrateur reconnu. Mode aperçu sans publication.';
      document.getElementById('r2-form-panel').hidden=false;
      return data.session;
    }catch(error) {
      if(authBox)authBox.textContent='⚠️ '+error.message;
      document.getElementById('r2-form-panel').hidden=true;
      return null;
    }
  };
  window.signOut=()=>{throw Error('Déconnexion désactivée sur cette page de test.');};
  report('Sélectionne un petit MP3, une couverture facultative et un titre. Après l’envoi, tous les fichiers de test seront supprimés automatiquement.');
})();
