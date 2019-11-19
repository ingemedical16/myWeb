App.contracts.PlaceDeMarche.deployed().then(function(instance) {
  placeDeMarcheInstance = instance;
  return placeDeMarcheInstance.getDemandesOuverte();
}).then(function(demandeIds) {
  // retrieve the demandes placeholder and clear it
  $('#demandesRow').empty();

  for(var i = 0; i < demandeIds.length; i++) {
    var demandeId = demandeIds[i];
    placeDeMarcheInstance.demandes(demandeId.toNumber()).then(function(demande){
      var _id = demande[0];
      var _entreprise = demande[1];
      var _illustrateur = demande[2];
      var _remuneration = demande[3];
      var _delai = demande[4]/ 86400;
      var _description = demande[5];
      var _etatDemande = demande[6];
      var _minReputation = demande[7];
      App.displayDemande(_id, _entreprise,_remuneration, _delai,_description,_etatDemande, _minReputation);
    });
  }
  App.loading = false;
}).catch(function(err) {
  console.error(err.message);
  App.loading = false;
});
