App = {
  web3Provider: null,
  contracts: {},
  account: 0x0,
  loading: false,
  dejaInscrie: false,
  accountName: "not membre",
  Etat: ["OUVERTE","ENCOURS","FERMEE"],

  init: function() {
    return App.initWeb3();

  },

  initWeb3: function() {
    // initialize web3
    if(typeof web3 !== 'undefined') {
      //reuse the provider of the Web3 object injected by Metamask
      App.web3Provider = web3.currentProvider;
    } else {
      //create a new provider and plug it directly into our local node
      App.web3Provider = new Web3.providers.HttpProvider('https://api.infura.io/v1/jsonrpc/ropsten');
    }
    web3 = new Web3(App.web3Provider);


    App.displayAccountInfo();

    return App.initContract();
  },

  displayAccountInfo: function() {
console.log("appele de function displayAccountInfo ")

    web3.eth.getCoinbase(function(err, account) {
      if(err === null) {
        App.account = account;

    App.getmembresName(account);
    //console.log(App.accountName);
      //  $('#account').text(account);

        web3.eth.getBalance(account, function(err, balance) {
          if(err === null) {
            $('#accountBalance').text(web3.fromWei(balance, "ether") + " ETH");
          }
        });

      }
    });

  },

  initContract: function() {
    $.getJSON('PlaceDeMarche.json', function(placeDeMarcheArtifact) {
      // get the contract artifact file and use it to instantiate a truffle contract abstraction
      App.contracts.PlaceDeMarche = TruffleContract(placeDeMarcheArtifact);
      // set the provider for our contracts
      App.contracts.PlaceDeMarche.setProvider(App.web3Provider);
      // listen to events
      App.listenToEvents();
       App.estMembre();

      // retrieve the article from the contract
      return App.reloadDemandes();
    });
  },

  reloadDemandes: function() {

    console.log("appele de function reloadDemandes! ")
    // avoid reentry
    if(App.loading) {
      return;
    }
    App.loading = true;

    // refresh account information because the balance might have changed

    App.displayAccountInfo();
    var placeDeMarcheInstance;
    App.contracts.PlaceDeMarche.deployed().then(function(instance) {
      placeDeMarcheInstance = instance;
      return placeDeMarcheInstance.getAdminAdress();
    }).then(function(admin){
      console.log(admin);
      if(App.account==admin){
        $('#demandesRow').empty();
        placeDeMarcheInstance.getNumberOfDemande().then(function(length){
          for(var i = 1; i <= length; i++){

            placeDeMarcheInstance.demandes(i).then(function(demande){
              var _id = demande[0];
              var _entreprise = demande[1];
              var _illustrateur = demande[2];
              var _remuneration = demande[3];
              var _delai = demande[4]/ 86400;
              var _description = demande[5];
              var _etatDemande = demande[6];
              var _minReputation = demande[7];
              App.displayAdmine(_id, _entreprise,_illustrateur,_remuneration, _delai,_description,_etatDemande, _minReputation);
            });

          }
        })
      }else {
        placeDeMarcheInstance.getDemandesOuverte().then(function(demandeIds) {
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
      });

    }
    App.loading = false;

  }).catch(function(err) {
    console.error(err.message);
    App.loading = false;
  });
},
  displayAdmine: function(id, entreprise,illustrateur,remuneration, delai,description,etatDemande,minReputation){
    var demandesRow = $('#demandesRow');
    var etherRemuneration = web3.fromWei(remuneration, "ether");
    var AdminDashboard = $("#AdminDashboard");
    var nowInseconde = Math.round(new Date().getTime()/1000);
    console.log("now " + nowInseconde)
    console.log(etatDemande.toNumber())
    var placeDeMarcheInstance;
    App.contracts.PlaceDeMarche.deployed().then(function(instance) {
      placeDeMarcheInstance = instance;

      placeDeMarcheInstance.getDelyTopay(id,illustrateur).then(function(tmp){

 console.log(id + '\n '+illustrateur +'\n big numbre ' +tmp.toNumber());

 AdminDashboard.find('.panel-title').text(id);
 AdminDashboard.find('.demande-illustrateur').text(illustrateur);
 AdminDashboard.find('.demande-AddressEntreprise').text(entreprise);
 AdminDashboard.find('.demande-description').text(description);
 AdminDashboard.find('.demande-price').text(etherRemuneration + " ETH");
 AdminDashboard.find('.demande-etatDemande').text(App.Etat[etatDemande]);
 AdminDashboard.find('.demande-minReputation').text(minReputation);
 if(delai > 30){
   delai = App.timeConverter(delai);
  AdminDashboard.find('.demande-delai').text(delai);
}else{
  AdminDashboard.find('.demande-delai').text(delai + " Jour");
}

 AdminDashboard.find('.btn-pay').attr('data-id', id);
 AdminDashboard.find('.btn-sanctionneIllstrateur').attr('data-address', illustrateur);
 AdminDashboard.find('.btn-sanctionneEntrprise').attr('data-address', entreprise);
console.log(nowInseconde +"<===> "+tmp)
 if(nowInseconde > tmp && tmp != 0 || etatDemande.toNumber()==2){
   AdminDashboard.find('.btn-pay').attr('data-address', illustrateur);
   AdminDashboard.find('.btn-pay').attr('data-val', etherRemuneration);
   AdminDashboard.find('.btn-pay').show();
   AdminDashboard.find('.btn-sanctionneIllstrateur').show()
   AdminDashboard.find('.btn-sanctionneEntrprise').show()

 }else{
   AdminDashboard.find('.btn-pay').hide();
   AdminDashboard.find('.btn-sanctionneIllstrateur').show()
   AdminDashboard.find('.btn-sanctionneEntrprise').show()
 }

demandesRow.append(AdminDashboard.html());

      }).catch(function(err) {
        console.error(err.message);

      });

    });
  },
  displayDemande: function(id, entreprise,remuneration, delai,description,etatDemande,minReputation) {

    App.contracts.PlaceDeMarche.deployed().then(function(instance) {
      placeDeMarcheInstance = instance;

      placeDeMarcheInstance.getmembresName(entreprise).then(function(name){


//console.log(entreprise);

//console.log(App.names[entreprise]);

    var demandesRow = $('#demandesRow');

    var etherRemuneration = web3.fromWei(remuneration, "ether");

    var demandeTemplate = $("#demandeTemplate");
    demandeTemplate.find('.panel-title').text(id);
    demandeTemplate.find('.demande-entreprise').text(name);
    demandeTemplate.find('.demande-AddressEntreprise').text(entreprise);
    demandeTemplate.find('.demande-description').text(description);
    demandeTemplate.find('.demande-price').text(etherRemuneration + " ETH");
    demandeTemplate.find('.demande-etatDemande').text(App.Etat[etatDemande]);
    demandeTemplate.find('.demande-minReputation').text(minReputation);
    demandeTemplate.find('.demande-delai').text(delai + " Jour");
    demandeTemplate.find('.btn-postuler').attr('data-id', id);


    // entreprise
    if (entreprise == App.account) {
      demandeTemplate.find('.demande-entreprise').text("Vous");
      demandeTemplate.find('.btn-postuler').hide();
    } else {

      demandeTemplate.find('.demande-entreprise').text(name);
      demandeTemplate.find('.btn-postuler').show();
    }

    // add this new demendes
    demandesRow.append(demandeTemplate.html());
  }).catch(function(err) {
    console.error(err.message);

  });

});

  },

   getmembresName:   function(addr){

     var placeDeMarcheInstance;

    App.contracts.PlaceDeMarche.deployed().then(function(instance) {
      placeDeMarcheInstance = instance;

      placeDeMarcheInstance.getmembresName(addr).then(function(name){


            $('#account').text(name + " ==> "+ addr);


        return  name;

      }).catch(function(err) {
        console.error(err.message);

      });

    });

  },

  timeConverter: function(UNIX_timestamp) {
            var a = new Date(UNIX_timestamp * 1000);
            var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            var year = a.getFullYear();
            var month = months[a.getMonth()];
            var date = a.getDate();
            var hour = a.getHours();
            var min = a.getMinutes();
            var sec = a.getSeconds();
            var time = date + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec;
            return time;
        },

  ajouterDemande: function() {

    // retrieve the detail of the demande
    var _price = web3.toWei(parseFloat($('#demande-price').val() || 0), "ether");
    var _delai = parseFloat($('#demande-delai').val())*86400;
    var _description = $('#demande-description').val();
    var _minReputation = parseInt($('#demande-minReputation').val());

    if((_description.trim() == '') || (_price == 0)|| (_delai==0)) {
      // nothing to add
      return false;
    }

    App.contracts.PlaceDeMarche.deployed().then(function(instance) {
      return instance.ajouterDemande(_price, _delai, _description, _minReputation, {
        from: App.account,
        value:_price * 1.02,
        gas: 500000
      });
    }).then(function(result) {

    }).catch(function(err) {
      console.error(err);
    });
  },

  // listen to events triggered by the contract
  listenToEvents: function() {
    App.contracts.PlaceDeMarche.deployed().then(function(instance) {
      instance.LogAjouterDemande({}, {}).watch(function(error, event) {
        if (!error) {
          $("#events").append('<li class="list-group-item">' + event.args._name + ' a ajouter un nouvaux demande</li>');
        } else {
          console.error(error);
        }
        App.reloadDemandes();
      });

      instance.LogPostuler({}, {}).watch(function(error, event) {
        if (!error) {
          $("#events").append('<li class="list-group-item">' + event.args._illustrateur + ' a postuler  a la demande de index' + event.args._id + '</li>');
        } else {
          console.error(error);
        }
        App.reloadDemandes();
      });
    });
  },

  postuler: function() {
    event.preventDefault();

    // retrieve the article
    var _demandeId = $(event.target).data('id');


    App.contracts.PlaceDeMarche.deployed().then(function(instance){
      return instance.postuler(_demandeId, {
        from: App.account,
        gas: 500000
      });
    }).catch(function(error) {
      console.error(error);
    });
  },


estMembre: function(){
  console.log("estMembre is call")
  var placeDeMarcheInstance;


  App.contracts.PlaceDeMarche.deployed().then(function(instance) {
    placeDeMarcheInstance = instance;
    return placeDeMarcheInstance.estMembre(App.account);
  }).then(function(isMembre) {
    console.log(isMembre);
    if(!isMembre){
      $('#inscrireBtn').show();
      $('#inscrireBtn1').show();
      $('#eventsBtn').hide();
      $('#ajouterBtn').hide();
      return isMembre;
    }else{
      $('#inscrireBtn').hide();
      $('#inscrireBtn1').hide();
      $('#eventsBtn').show();
      $('#ajouterBtn').show();
      return isMembre;
    }

}).catch(function(error) {
  console.error(error);
});
},
inscription: function(){
  var _membre_name = $('#membre_name').val();

  if(_membre_name.trim() == '') {
    // entre le nom
    return false;
  }
  App.contracts.PlaceDeMarche.deployed().then(function(instance) {
    return instance.inscription(_membre_name, {
      from: App.account,
      gas: 500000
    });
  }).then(function(result) {
    App.estMembre();

  }).catch(function(err) {
    console.error(err);
  });
}
};

$(function() {
  $(window).load(function() {
    App.init();


  });
});
