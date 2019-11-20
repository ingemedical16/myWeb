pragma solidity ^0.5.12;
//pragma experimental ABIEncoderV2;
import "./Ownable.sol";


contract PlaceDeMarche is Ownable {

  enum Etat {OUVERTE,ENCOURS,FERMEE}
  mapping (address => bool) public membres;
  mapping(address => uint256) public reputation;
  mapping(address => string) public  names;
  mapping (address => bool) private addressBannies; // address bannies true adress bannies false
  mapping (uint => Demande) public demandes;
  mapping (uint =>mapping(uint => address))public candidates;
  uint[] CandidatsCounter;
  mapping(uint =>mapping(address=> uint256)) private _balance;
  uint demandeCounter;
 mapping(uint => mapping(address =>uint)) private delytopay;
 mapping(uint => bool) private dejaPaye;
 mapping(uint => uint) public dataLimte;

  address payable private wallet;
  mapping (address => Link) private links;


  struct Demande {
    uint id;
    address entreprise;
    address illustrateur;
    uint256 remuneration;
    uint256 delai;
    string description;
    Etat etatDemande;
    uint256 minReputation;

 }
 struct Link {
  address entreprise;
  string url;
 }

 event LogAjouterDemande(
   uint indexed _id,
   address indexed _entreprise,
   string _name,
   uint256 _remuneration
 );
 event LogPostuler(
   uint indexed _id,
   address indexed _entreprise,
   address indexed _illustrateur,
   string _name,
   uint256 _remuneration
 );

 // deactivate the contract
 function kill() public onlyOwner {
   selfdestruct(admin);
 }

     constructor() public {

         wallet = admin;
         membres[admin]=true;
         names[admin]= "Administrateur";

    }

function inscription(string memory nume) public  {
    require(!estMembre(msg.sender),"vous etes deja inscrit!");
     reputation[msg.sender] = 1;
     names[msg.sender]= nume;
     membres[msg.sender]=true;
 }

 function estMembre(address utilisateur) public view returns (bool) {

            if (membres[utilisateur]) {
                return true;
            }else{

        return false;
            }
    }

    function ajouterDemande( uint256  _remuneration,uint256  _delai,string memory _description,uint256 _minReputation) public payable {
        require(estMembre(msg.sender));
        require(!addressBannies[msg.sender]);
        uint256 amount = _remuneration*102/100;
        require(msg.value == amount);
        address illustrateur;
        wallet.transfer(amount);
        demandeCounter++;
        demandes[demandeCounter] = Demande(
          demandeCounter,
          msg.sender,
         illustrateur,
          _remuneration,
          _delai,
          _description,
          Etat.OUVERTE,
          _minReputation

          );

          emit LogAjouterDemande(
            demandeCounter,
            msg.sender,
            names[msg.sender],
            _remuneration
          );
    }

    function getNumberOfDemande() public view returns (uint) {
      return demandeCounter;
    }
    function getNumberOfMyCandidats(uint _indice) public view returns (uint) {
      return CandidatsCounter[_indice];
    }

    function getDemandesOuverte() public view returns ( uint[] memory demandesOuverte) {
      // prepare output array
      uint[] memory demandeIds = new  uint[](demandeCounter);

      uint numberOfDemandesOuverte = 0;
      // iterate over articles
      for(uint i = 1; i <= demandeCounter;  i++) {
        // keep the ID if the article is still for sale
        if(demandes[i].etatDemande == Etat.OUVERTE) {
          demandeIds[numberOfDemandesOuverte] = demandes[i].id;
          numberOfDemandesOuverte++;
        }
      }

      // copy the articleIds array into a smaller forSale array
      demandesOuverte = new uint[](numberOfDemandesOuverte);
      for(uint j = 0; j < numberOfDemandesOuverte; j++) {
        demandesOuverte[j] = demandeIds[j];
      }
      return demandesOuverte;
    }
    function getMesDemandes() public view returns ( uint[] memory Mesdemandes) {
      // prepare output array
      uint[] memory demandeIds = new  uint[](demandeCounter);

      uint numberOfMesdemandes = 0;
      // iterate over articles
      for(uint i = 1; i <= demandeCounter;  i++) {
        // keep the ID if the article is still for sale
        if(demandes[i].entreprise == msg.sender) {
          demandeIds[numberOfMesdemandes] = demandes[i].id;
          numberOfMesdemandes++;
        }
      }

      // copy the articleIds array into a smaller forSale array
      Mesdemandes = new uint[](numberOfMesdemandes);
      for(uint j = 0; j < numberOfMesdemandes; j++) {
        Mesdemandes[j] = demandeIds[j];
      }
      return Mesdemandes;
    }


    function postuler(uint _indice) public {
        //permet à un indépendant de proposer ses services. Il est alors ajouté à la liste des candidats
        require(demandeCounter > 0);

        // we check that the article exists
        require(_indice > 0 && _indice <= demandeCounter);

        // we retrieve the article
        Demande storage demende = demandes[_indice];

        // we check that the article has not been sold yet
        require(demende.etatDemande == Etat.OUVERTE);

        // we don't allow the seller to buy his own article
        require(msg.sender != demende.entreprise);
        require(estMembre(msg.sender),"veuillez vous inscrire");
        require(reputation[msg.sender]>= demende.minReputation, "reputation insuffisante pour acceder a cette offre");
        CandidatsCounter[_indice] +=1;
        candidates[_indice][CandidatsCounter[_indice]]= msg.sender;
        links[msg.sender].entreprise = demende.entreprise;
        links[msg.sender].url = "";
        emit LogPostuler(
          _indice,
          demende.entreprise,
          msg.sender,
          names[msg.sender],
          demende.remuneration
        );

    }

    function accepterOffre(uint indDemande,uint indiceCandidat, address _candidats) public {
        //permet à l’entreprise d’accepter un illustrateur. La demande est alors ENCOURS jusqu’à sa remise
        require(demandes[indDemande].entreprise == msg.sender);
        require(demandes[indDemande].etatDemande == Etat.OUVERTE);
        require(candidates[indDemande][indiceCandidat]== _candidats);
        dataLimte[indDemande]= demandes[indDemande].delai+ now;
        demandes[indDemande].etatDemande = Etat.ENCOURS;
        demandes[indDemande].illustrateur = _candidats;
        _balance[indDemande][_candidats] =demandes[indDemande].remuneration;


    }

     function livraison(string memory _url,uint _id) public {
         links[msg.sender].url = _url;
         delytopay[_id][msg.sender] = now + 604800;

     }

     function fermerDemande(uint _id) public {
         require(demandes[_id].entreprise == msg.sender);
         demandes[_id].etatDemande = Etat.FERMEE;
     }

     function sanctionne(address _membre) public {
       require(estMembre(_membre),"cette Address n est pas dans la base de done");
         if(msg.sender == admin){

             addressBannies[_membre] = true;
         }else{
             if(reputation[_membre]== 0){
                 addressBannies[_membre] = true;
             }
         }

     }

     function estEnRetard(uint indDemande) public  returns (bool){
         require(demandes[indDemande].entreprise == msg.sender);
         require(estMembre(demandes[indDemande].illustrateur));
      address _candidats = demandes[indDemande].illustrateur;
         if(dataLimte[indDemande]>now){
             reputation[_candidats] = reputation[_candidats] -1;
             sanctionne(_candidats);
             return true;
         }else{
             return false;

         }

     }
     function satisfaction(address _membre,uint256 _satisfaction) public {

         reputation[_membre] = reputation[_membre] + _satisfaction;
     }

     function transferToIllstrateur(address payable _illestrateur,uint _id) public {
         require(msg.sender == admin);
         require(!dejaPaye[_id]);
         require(demandes[_id].illustrateur == _illestrateur);
         require( demandes[_id].etatDemande == Etat.FERMEE || delytopay[_id][_illestrateur]<= now);
         uint256 amount = demandes[_id].remuneration;
         require(amount == _balance[_id][_illestrateur]);
         _illestrateur.transfer(amount);
         demandes[_id].etatDemande = Etat.FERMEE;
         _balance[_id][_illestrateur]=0;
         dejaPaye[_id]=true;

     }

     function getmembresName(address addr) public view returns (string memory nom){
        nom = names[addr];
       return nom;
     }
    function getAdminAdress() public view returns (address  addre){
      addre = admin;
      return addre;
    }
    function getDelyTopay(uint _id,address _illustrateur) public view returns (uint tmp){
     tmp = delytopay[_id][_illustrateur];
     return tmp;
    }

}
