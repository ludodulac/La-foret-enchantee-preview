/* Preview 046 deliberately cannot connect to Supabase. */
window.dbClient={
  from(){return {select(){return{order:async()=>({data:[],error:null})}}}},
  storage:{from(){return{
    download:async()=>({data:null,error:{message:'Sonothèque distante désactivée dans cet essai'}}),
    upload:async()=>({error:{message:'Publication distante désactivée'}}),
    remove:async()=>({error:{message:'Suppression distante interdite'}})
  }}}
};