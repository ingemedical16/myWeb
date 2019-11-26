App = {
    web3Provider: null,
    contracts: {},
    account: 0X0,
    loading: false,
    admin:false,
    isMembre: false,
    accountName: "is not membre",
    Etat: ["OUVERTE","ENCOURS","FERMEE"],
    demendes:[0],
    count:0,

    init: async () => {
        return App.initWeb3();//logPostulerListener
    },

    initWeb3: async () => {
        if(window.ethereum) {
            window.web3 = new Web3(window.ethereum);
            try {
                await window.ethereum.enable();
                App.displayAccountInfo();
                return App.initContract();
            } catch(error) {
                //user denied access
                console.error("Unable to retrieve your accounts! You have to approve this application on Metamask");
            }
        } else if(window.web3) {
            window.web3 = new Web3(web3.currentProvider || "ws://localhost:8545");
            App.displayAccountInfo();
            return App.initContract();
        } else {
            //no dapp browser
            console.log("Non-ethereum browser detected. You should consider trying Metamask");
        }
    },

    displayAccountInfo: async () => {
      console.log("displayAccountInfo demende===========================>",App.count);
      App.count++;
        const accounts = await window.web3.eth.getAccounts();
        App.account = accounts[0];
        $('#account').text(App.account);
        const balance = await window.web3.eth.getBalance(App.account);
        $('#accountBalance').text(window.web3.utils.fromWei(balance, "ether") + " ETH");
        await App.estMembre();
        App.accountName = await App.getName(App.account);
        await App.getAdminAdress();
        $('#accountName').text("Binevenu, " +App.accountName);

    },

    getAdminAdress: async () => {
      console.log("getAdminAdress demende===========================>",App.count);
      App.count++;
      const placeDeMarcheInstance = await App.contracts.placeDeMarcheArtifact.deployed();
       App.admin = await placeDeMarcheInstance.getAdminAdress();
      console.log("App.admin "+App.admin+" ",App.count);
      App.count++;
      console.log("App.account[0] "+App.account+" ",App.count);
      App.count++;
    },
    initContract: async () => {
      console.log("initContract demende===========================>",App.count);
      App.count++;
        $.getJSON('PlaceDeMarche.json', placeDeMarcheArtifact => {
            App.contracts.placeDeMarcheArtifact = TruffleContract(placeDeMarcheArtifact);
            App.contracts.placeDeMarcheArtifact.setProvider(window.web3.currentProvider);
            App.estMembre();
            App.listenToEvents();
            return App.reloadDemandes();
        });
    },

    // get name of  account
    getName: async (accountAddress) =>{
      console.log("getName demende===========================>",App.count);
      App.count++;
      if(App.isMembre){
        const placeDeMarcheInstance = await App.contracts.placeDeMarcheArtifact.deployed();
        const name = await placeDeMarcheInstance.getmembresName(accountAddress);
        return name;
      }else{
        return "inscrie-vous s'il vous plait";
      }

    },

    // verivication si account 0 est membres
   estMembre: async () =>{
      console.log("estMembre is call ",App.count);
      App.count++;

      const placeDeMarcheInstance = await App.contracts.placeDeMarcheArtifact.deployed();

      App.isMembre =  await placeDeMarcheInstance.estMembre(App.account);

        console.log("is Membre: "+App.isMembre+" "+App.count);
        App.count++;
        if(!App.isMembre){
          $('.inscription').show();
          $('.disable').hide();
          return App.isMembre;
        }else{
          $('.inscription').hide();
          $('.disable').show();
          return App.isMembre;
        }



    },

    // Listen to events raised from the contract
    listenToEvents: async () => {
      console.log("listenToEvents demende===========================>");
        const placeDeMarcheInstance = await App.contracts.placeDeMarcheArtifact.deployed();
        if(App.logAjouterDemandeListener == null) {
            App.logAjouterDemandeListener = placeDeMarcheInstance
                .LogAjouterDemande({fromBlock: '0'})
                .on("data", event => {
                    $('#' + event.id).remove();
                    $("#events").append('<li class="list-group-item">' + event.returnValues._name + ' a ajouter un nouvaux demande id:'+ event.returnValues.id+'</li>');

                    App.reloadDemandes();
                })
                .on("error", error => {
                    console.error(error);
                });
        }
        if(App.logPostulerListener == null) {
            App.logPostulerListener = placeDeMarcheInstance
                .LogPostuler({fromBlock: '0'})
                .on("data", event => {
                    $('#' + event.id).remove();
                  //  $('#events').append('<li class="list-group-item" id="' + event.id + '">' + event.returnValues._buyer + ' bought ' + event.returnValues._name + '</li>');
                    $("#events").append('<li class="list-group-item">' + event.returnValues._illustrateur + ' a postuler  a la demande de index' + event.returnValues._id + '</li>');
                    App.reloadDemandes();
                })
                .on("error", error => {
                    console.error(error);
                });
        }

        //$('.btn-subscribe').hide();
        //$('.btn-unsubscribe').show();
        //$('.btn-show-events').show();
    },

    stopListeningToEvents: async () => {
      console.log("stopListenToEvents demende===========================>");

        if(App.logAjouterDemandeListener != null) {
            console.log("unsubscribe from sell events");
            await App.logAjouterDemandeListener.removeAllListeners();
            App.logAjouterDemandeListener = null;
        }
        if(App.logPostulerListener != null) {
            console.log("unsubscribe from buy events");
            await App.logPostulerListener.removeAllListeners();
            App.logPostulerListener = null;
        }

        $('#events')[0].className = "list-group-collapse";

        //$('.btn-subscribe').show();
        //$('.btn-unsubscribe').hide();
        //$('.btn-show-events').hide();
    },

    ajouterDemande: async () => {
      console.log("ajouterDemande demende===========================>");
      // retrieve the detail of the demande
        const DemandePriceValue = parseFloat($('#demande-price').val());
        const DemandePrice = isNaN(DemandePriceValue) ? "0" : DemandePriceValue.toString();
        const _price = window.web3.utils.toWei(DemandePrice, "ether");
        var _delai = parseFloat($('#demande-delai').val())*86400;
        var _description = $('#demande-description').val();
        var _minReputation = parseInt($('#demande-minReputation').val());

        if((_description.trim() == '') || (_price == 0)|| (_delai==0)) {
          // nothing to add
          return false;
        }

        try {
            const placeDeMarcheInstance = await App.contracts.placeDeMarcheArtifact.deployed();
            const transactionReceipt = await placeDeMarcheInstance.ajouterDemande(
                _price,
                _delai,
                _description,
                _minReputation,
                {
                  from: App.account,
                  value:_price * 1.02,
                  gas: 5000000
                }
            ).on("transactionHash", hash => {
                console.log("transaction hash", hash);
            });
            console.log("transaction receipt", transactionReceipt);
        } catch(error) {
            console.error(error);
        }
        App.reloadDemandes();
    },

    postuler: async () => {
      console.log("postuler demende===========================>");

        event.preventDefault();

        // retrieve the Demande price
        var _DemandeId = $(event.target).data('id');

        try {
            const placeDeMarcheInstance = await App.contracts.placeDeMarcheArtifact.deployed();
            const transactionReceipt = await placeDeMarcheInstance.postuler(
                _DemandeId, {
                    from: App.account,
                    gas: 500000
                }
            ).on("transactionHash", hash => {
                console.log("transaction hash", hash);
            });
            console.log("transaction receipt", transactionReceipt);
        } catch(error) {
            console.error(error);
        }
    },

    accepterOffre: async () => {
console.log("accepterOffre demende===========================>");
        event.preventDefault();

        // retrieve the Demande price
        var s = $(event.target).data('id');



        var ids = s.split('_');

      //  while(s.charAt(0) != '_')
        //{
          //s = s.substr(1);
        //}
        //s = s.substr(1);
        var _DemandeId = parseInt(ids[1]);
        var _selcId='#selcId_'+ _DemandeId+' option:selected';
        //console.log(_selcId);
        //console.log('accepterOffre test '+ _DemandeId +"option: ")
          var d =  $(_selcId).val();
          var donnees= d.split('_');
          var _indCandidat = parseInt(donnees[1]);
          var _candidats = donnees[0];
          console.log("candidat: "+_candidats)
          //console.log("done: " +datee);

        //console.log(" test "+done.length + done[done.length-1]);

        try {
            const placeDeMarcheInstance = await App.contracts.placeDeMarcheArtifact.deployed();
            const transactionReceipt = await placeDeMarcheInstance.accepterOffre(
                _DemandeId,_indCandidat,_candidats, {
                    from: App.account,
                    gas: 500000
                }
            ).on("transactionHash", hash => {
                console.log("transaction hash", hash);
            });
            console.log("transaction receipt", transactionReceipt);
        } catch(error) {
            console.error(error);
        }
    },

    inscription: async () => {
      console.log("inscription demende===========================>");
      var _membre_name = $('#membre_name').val();

      // verifie entre  de nom de membre
      if(_membre_name.trim() == '') {
        // entre le nom
        return false;
      }

        try {
            const placeDeMarcheInstance = await App.contracts.placeDeMarcheArtifact.deployed();
            const transactionReceipt = await placeDeMarcheInstance.inscription(
                _membre_name, {
                    from: App.account,
                    gas: 500000
                }
            ).on("transactionHash", hash => {
                console.log("transaction hash", hash);
            });
            console.log("transaction receipt", transactionReceipt);
        } catch(error) {
            console.error(error);
        }
      App.reloadDemandes();
    },

    reloadDemandes: async () => {
      console.log("reloadDemandes demende===========================> ",App.count);
      App.count++
        // avoid reentry
        if (App.loading) {
            return;
        }
        App.loading = true;

        // refresh account information because the balance may have changed
        App.displayAccountInfo();

        console.log("admin: "+App.admin,App.count);
        App.count++;


          try {
              const placeDeMarcheInstance = await App.contracts.placeDeMarcheArtifact.deployed();
              const Ids = await placeDeMarcheInstance.getNumberOfDemande();
              $('#demandesRow').empty();
              for(let i = 1; i <= Ids; i++) {
                  const demande = await placeDeMarcheInstance.demandes(i);
                  var _id = demande[0];
                  var _entreprise = demande[1];
                  var _illustrateur = demande[2];
                  var _remuneration = demande[3];
                  var _delai = demande[4]/ 86400;
                  var _description = demande[5];
                  var _etatDemande = demande[6];
                  var _minReputation = demande[7];
                  if(App.account === "0x06DF8809B1D43274b6A132B1ade92d460D2C5704") {
                    console.log("admin is true ===========================> ",App.count);
                    console.log(" appel displayAdmine: ");
                  App.displayAdmine(_id, _entreprise,_illustrateur,_remuneration, _delai,_description,_etatDemande, _minReputation);



                }else{
                  console.log("admin is false ===========================> ",App.count);
                  console.log(" appel displayDemande: ");
                  App.displayDemande(_id, _entreprise,_illustrateur,_remuneration, _delai,_description,_etatDemande, _minReputation);
                  App.getCandidat(_id,_entreprise);
                  console.log("_etatDemande ",_etatDemande.toNumber(),App.count);
                  }
                }

              App.loading = false;
          } catch(error) {
              console.error(error);
              App.loading = false;
          }



    },

    displayAdmine:async (id, entreprise,illustrateur,remuneration, delai,description,etatDemande,minReputation) => {

      console.log("displayAdmine demende===========================>");
      var demandesRow = $('#demandesRow');
      var etherRemuneration = web3.utils.fromWei(remuneration, "ether");
      var AdminDashboard = $("#AdminDashboard");
      var nowInseconde = Math.round(new Date().getTime()/1000);
      const placeDeMarcheInstance = await App.contracts.placeDeMarcheArtifact.deployed();
      const tmp = await placeDeMarcheInstance.getDelyTopay(id,illustrateur);
      AdminDashboard.find('.panel-title').text(id);
      AdminDashboard.find('.demande-illustrateur').text(illustrateur);
      AdminDashboard.find('.demande-AddressEntreprise').text(entreprise);
      AdminDashboard.find('.demande-description').text(description);
      AdminDashboard.find('.demande-price').text(etherRemuneration + " ETH");
      AdminDashboard.find('.demande-etatDemande').text(App.Etat[etatDemande]);
      AdminDashboard.find('.demande-minReputation').text(minReputation);
      AdminDashboard.find('.demande-delai').text(delai + " Jour");
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


    },

    timeConverter: (UNIX_timestamp) =>{
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

    displayDemande: async (id, entreprise,illustrateur,remuneration, delai,description,etatDemande,minReputation) => {
      console.log("displayDemande demende===========================>",App.count);
        //var itmes = [];
        //itmes.push(' <button type="button" class="btn btn-primary btn-success pull-left btn-accepterOffre" onclick="App.accepterOffre(); return false;">Accepter Offre</button>');
        const placeDeMarcheInstance = await App.contracts.placeDeMarcheArtifact.deployed();
        var name = await placeDeMarcheInstance.getmembresName(entreprise);
        // Retrieve the Demande placeholder
        var demandesRow = $('#demandesRow');
        const etherRemuneration = web3.utils.fromWei(remuneration, "ether");

        var demandeTemplate = $("#demandeTemplate");
        demandeTemplate.find('.panel-title').text(id);
        demandeTemplate.find('.demande-entreprise').text(name);
        demandeTemplate.find('.demande-AddressEntreprise').text(entreprise);
        demandeTemplate.find('.demande-illustrateur').text(illustrateur);
        demandeTemplate.find('.demande-description').text(description);
        demandeTemplate.find('.demande-price').text(etherRemuneration + " ETH");
        demandeTemplate.find('.demande-etatDemande').text(App.Etat[etatDemande]);
        demandeTemplate.find('.demande-minReputation').text(minReputation);
        demandeTemplate.find('.demande-delai').text(delai + " Jour");
        demandeTemplate.find('.btn-postuler').attr('data-id', id);
        demandeTemplate.find('.btn-fermerDemande').attr('data-id', id);
        demandeTemplate.find('.btn-livraison').attr('data-id', id);
        var idcand = 'IdDemande'+id;
        let idcandi = '#IdDemande'+id;
        demandeTemplate.find('.btn-candidates').attr('data-target', idcandi);
        demandeTemplate.find('.btn-candidates').attr('aria-controls', idcand);
        demandeTemplate.find('.sectionCandida').empty();
        demandeTemplate.find('.sectionCandida').attr('id',idcand);


      //demandeTemplate.find(idcandi).text(candidatsDashboard.html());

      //if (entreprise == App.account){
        //candidatsDashboard.find('.btn-accepterOffr').show();
    //  }else{
        //candidatsDashboard.find('.btn-accepterOffr').hide();
    //  }
    //class="collapse list-group"
    //$("<div/>", {
      //  "class": "list-group",
      //  "id": '"demandeId'+id+'"',
    //    html: itmes.join("")
  //  }).appendTo(demandeTemplate.find(idcandi));

if(illustrateur == App.account){
  demandeTemplate.find('.demande-illustrateur').text("vous");

  //$(".livraison").show();
  demandeTemplate.find('.livraison').show();
}else{
  //$(".livraison").hide();
  demandeTemplate.find('.livraison').hide();
}



    // entreprise
    if (entreprise == App.account || etatDemande.toNumber()==1 || etatDemande.toNumber()==2){
          demandeTemplate.find('.btn-postuler').hide();

        if(entreprise == App.account ){
          demandeTemplate.find('.demande-entreprise').text("Vous");

          }

    }else{

      demandeTemplate.find('.demande-entreprise').text(name);
      demandeTemplate.find('.btn-postuler').show();
    

    }

    if (entreprise == App.account && etatDemande.toNumber()==1){
    demandeTemplate.find('.btn-fermerDemande').show();

    }else{
    demandeTemplate.find('.btn-fermerDemande').hide();
    }

    // add this new demendes
    demandesRow.append(demandeTemplate.html());

    },

    getCandidat: async (id,entreprise) =>{


      try {
      const placeDeMarcheInstance = await App.contracts.placeDeMarcheArtifact.deployed();
      var numbreOfcandidats = await placeDeMarcheInstance.getNumberOfMyCandidats(id);
      for (var i=1; i<= numbreOfcandidats;i++){
      var candidat = await  placeDeMarcheInstance.candidates(id,i);
      var reputation = await  placeDeMarcheInstance.reputation(candidat);

      App.displayCandidat(id,entreprise,candidat,reputation,i);
      console.log("displayCandidat appel ===========================>",App.count);
      }


  } catch(error) {
      console.error(error);

  }



    },

    displayCandidat: async (id,entreprise,candidat,reputation,i) => {
App.count++;
      console.log("displayCandidat demende===========================>",App.count);


      candidatSection = $('#IdDemande'+id);

      var candidatsDashboard = $("#candidatsDashboard");//listCand
        candidatsDashboard.find('.panel-title').text(i);
        candidatsDashboard.find('.listCand').append('<option value="'+candidat+'_'+i+'">'+candidat+'  => :'+reputation+'</option>');
        var btnId='btnId_'+id
        var selcId='selcId_'+id
        candidatsDashboard.find('.btn-accepterOffre').attr('data-id',btnId);
        candidatsDashboard.find('.listCand').attr('id',selcId);

        if (entreprise == App.account) {

          candidatsDashboard.find('.btn-accepterOffre').show();

        }else{
          candidatsDashboard.find('.btn-accepterOffre').hide();
        }

        candidatSection.append(candidatsDashboard.html());


    },

    fermerDemande: async ()=>{
      event.preventDefault();

      // retrieve the Demande price
      var _id = $(event.target).data('data-id');
      console.log(_id)



      const placeDeMarcheInstance = await App.contracts.placeDeMarcheArtifact.deployed();
      const demande = await placeDeMarcheInstance.demandes(_id);
      var _entreprise = demande[1];

      if(App.account == _entreprise){
        try {
            const placeDeMarcheInstance = await App.contracts.placeDeMarcheArtifact.deployed();
            const transactionReceipt = await placeDeMarcheInstance.fermerDemande(
                 _id,{
                    from: App.account,
                    gas: 500000
                }
            ).on("transactionHash", hash => {
                console.log("transaction hash", hash);
            });
            console.log("transaction receipt", transactionReceipt);
        } catch(error) {
            console.error(error);
        }
      App.reloadDemandes();

    }else{
      alert("verify votre url ou Id essyer de nouvaux");
    }



    },

    livraison: async () => {
    var _id = parseInt($('#demande-id').val());
    var _livraisonUrl = $('#livraison-url').val();
    const placeDeMarcheInstance = await App.contracts.placeDeMarcheArtifact.deployed();
    const demande = await placeDeMarcheInstance.demandes(_id);
    var _illustrateur = demande[2];

    if(_livraisonUrl.trim()!=''  && App.account == _illustrateur){
      try {
          const placeDeMarcheInstance = await App.contracts.placeDeMarcheArtifact.deployed();
          const transactionReceipt = await placeDeMarcheInstance.livraison(
              _livraisonUrl, _id,{
                  from: App.account,
                  gas: 500000
              }
          ).on("transactionHash", hash => {
              console.log("transaction hash", hash);
          });
          console.log("transaction receipt", transactionReceipt);
      } catch(error) {
          console.error(error);
      }
    App.reloadDemandes();

  }else{
    alert("verify votre url ou Id essyer de nouvaux");
  }

    },
    isValidUrl: async (string) => {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}




};

$(function () {
    $(window).load(function () {
        App.init();
    });
});
