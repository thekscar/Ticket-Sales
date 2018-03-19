// Import the page's CSS. Webpack will know what to do with it.
import "../stylesheets/app.css";

// Import libraries we need.
import { default as Web3} from 'web3';
import { default as contract } from 'truffle-contract'

// Import our contract artifacts and turn them into usable abstractions.
import ticketsaleshub_artifacts from '../../build/contracts/TicketSalesHub.json'
import ticketedevents_artifacts from '../../build/contracts/TicketedEvents.json'
import eventfactory_artifacts from '../../build/contracts/EventFactory.json'
import eventfactoryinterface_artifacts from '../../build/contracts/EventFactoryInterface.json'

// TicketSalesHub & TicketedEvents are usable abstractions, which we'll use through the code below.
var TicketSalesHub = contract(ticketsaleshub_artifacts);
var TicketedEvents = contract(ticketedevents_artifacts);
var EventFactory = contract(eventfactory_artifacts);
var EventFactoryInterface = contract(eventfactoryinterface_artifacts);

// The following code is simple to show off interacting with your contracts.
// As your needs grow you will likely need to change its form and structure.
// For application bootstrapping, check out window.addEventListener below.
var accounts;
var account;

window.App = {
  start: function() {
    var self = this;

    // Bootstrap the MetaCoin abstraction for Use.
    TicketSalesHub.setProvider(web3.currentProvider);
    TicketedEvents.setProvider(web3.currentProvider);
    EventFactory.setProvider(web3.currentProvider);
    EventFactoryInterface.setProvider(web3.currentProvider);
    

    // Get the initial account balance so it can be displayed.
    web3.eth.getAccounts(function(err, accs) {
      if (err != null) {
        alert("There was an error fetching your accounts.");
        return;
      }

      if (accs.length == 0) {
        alert("Couldn't get any accounts! Make sure your Ethereum client is configured correctly.");
        return;
      }

      accounts = accs;
      account = accounts[0];
      var account_element = document.getElementById("theaccount");
      account_element.innerHTML = account; 
      self.checkaccounts();
      self.refreshBalance();
      self.refreshRole(); 
    });
  },


  checkaccounts: function() {
    var self = this; 
    var accountInterval = setInterval(function() {
      web3.eth.getAccounts(function(err, accs){
        if (err!=null){
          alert("There is an error with your accounts updates.");
          return; 
        }

        if (accs.length == 0) {
          alert("Couldn't get any accounts! Make sure your Ethereum client is configured correctly.");
          return;
        }
        if (accs[0] !== account) {
          account = accs[0];
          var account_element = document.getElementById("theaccount");
          account_element.innerHTML = account; 
          //updateInterface();
          self.refreshBalance();
          self.refreshRole();
        }
      }, 100);


      })
    
},

  refreshRole: function() {
    var self = this; 
    var hub; 
    var anotherhub; 
    TicketSalesHub.deployed().then(function(instance){
      hub = instance; 
      return hub.owner({from:account});
    }).then(function(result){
      if (account==result){
        var role_element = document.getElementById("yourrole");
        role_element.innerHTML = "Application Manager";
      } else {
        TicketSalesHub.deployed().then(function(instance){
          anotherhub = instance; 
          return anotherhub.isApprovedSeller(account)
        }).then(function(result){
          if (result) {
            var role_element = document.getElementById("yourrole");
            role_element.innerHTML = "Ticket Seller";
          } else {
            var role_element = document.getElementById("yourrole");
            role_element.innerHTML = "Ticket Buyer";
          }
        }).catch(function(e){
          console.log(e);
        });
      }
    }).catch(function(e){
      console.log(e);
    })
  },

  refreshBalance: function() {
    web3.eth.getBalance(account, function(err, currentBalance){
      if (err != null){
        console.log(err)
        alert("There was an error fetching your balance.")
      } 
      var ethBalance = web3.fromWei(currentBalance, "Ether");
      var balance_element = document.getElementById("thebalance");
      balance_element.innerHTML = ethBalance; 
    });

  },

  sellerRequest: function(){
    var self = this;
    var hub; 
    self.setRequestStatus("Please wait while we confirm your request...");
    TicketSalesHub.deployed().then(function(instance){
      hub = instance; 
      return hub.ticketSellerRequest({from:account, gas:200000})
    }).then(function(result){
      //Only start watching if not already. 
      console.log("The ticket seller request event ", result);
      if( document.getElementById("noSellers"){
        self.watchTicketSellerRequest(); 
      }
      self.setRequestStatus("Your request is confirmed, please wait for the application manager to approve.")
    }).catch(function(e){
      console.log(e);
    })
    self.refreshRole();
    self.refreshBalance(); 
  },

  setRequestStatus: function(message) {
    var status = document.getElementById("requestStatus");
    status.innerHTML = message;
  },

  setApprovalStatus: function(message) {
    var status = document.getElementById("approvalStatus");
    status.innerHTML = message;
  },

  approveSeller: function(){
    var self = this; 
    var hub; 
    var toApprove = document.getElementById("sellerToApprove").value;
    self.setApprovalStatus("Please wait for approval to confirm.")
    TicketSalesHub.deployed().then(function(instance){
      hub = instance; 
      return hub.approveTicketSeller(toApprove, {from:account, gas:200000})
    }).then(function(result){
      console.log(result);
      self.setApprovalStatus("Approval is confirmed.")
    }).catch(function(e){
      console.log(e);
    })
  },

  setEventStatus: function(message) {
    var status = document.getElementById("eventStatus");
    status.innerHTML = message; 
  },

  createEvent: function() {
    var self = this; 
    var hub; 
    var eName = document.getElementById("eventName").value;
    var eLocation = document.getElementById("eventLocation").value;
    var eSym = document.getElementById("eventSym").value; 
    var eTotalTickets = parseInt(document.getElementById("totalTickets").value);
    var eTicketPrice = parseInt(document.getElementById("ticketPrice").value);
    self.setEventStatus("Please wait for confirmation...");
    console.log(account)
    console.log(TicketSalesHub.deployed())
    TicketSalesHub.deployed().then(function(instance){
      hub = instance;
      return hub.createEventSale(eName, eLocation, eSym, eTotalTickets, eTicketPrice, {from:account})
    }).then(function(result){
      console.log("The event created result ", result);
      if( document.getElementById("noEvents"){
        self.watchNewlyCreatedEvents(); 
      }
      
      self.setEventStatus("Event has been confirmed and created.");
    }).catch(function(e){
      console.log(e);
      self.setEventStatus("Error occurred, event not yet created.")
    })
  },

  setTicketStatus: function(message) {
    var status = document.getElementById("statusTicket");
    status.innerHTML = message; 
  },

  buyTicket: function() {
    var self = this; 
    var theEvent;
    var eAdd = document.getElementById("eventPurchase").value;
    self.setTicketStatus("Please wait while we confirm ticket purchase...")
    TicketedEvents.at(eAdd).then(function(instance){
      theEvent = instance; 
      return theEvent.buyTicket(0x3b9c96646136e5fe60f8b3a7d036c44df112f08d37d2d26be9a1c9f856bffc8c, {from:account, value: 500})
    }).then(function(result){
      self.setTicketStatus("Ticket purchase confirmed.")
    }).catch(function(e){
      console.log(e);
    })
  }, 

  watchTicketSellerRequest: function() {
    TicketSalesHub.then(function(instance){
      var event = instance.TicketSellerRequestEvent({fromBlock:0, toBlock:'latest'});
      event.watch(function(error, result){
          if (!error) {
            var log = result.logs[0];
            var noSellers = document.getElementById("noSellers");
            if (noSellers) {
              noSellers.parentElement.removeChild(noSellers);
            }
            var newTableRow = document.createElement("tr");
            var newSellerRequest = document.createElement("td");
            newSellerRequest.appendChild(document.createTextNode(log.args.requestedTicketSeller)); 
            newTableRow.appendChild(newSellerRequest);
            var tablenode = document.getElementById("newTicketSellerRequests");
            tablenode.appendChild(newTableRow);
            
          }
        }); 
    })
  }, 

  watchNewlyCreatedEvents: function() {
    TicketSalesHub.then(function(instance){
      var event = instance.TicketEventCreatedEvent({fromBlock:0, toBlock:'latest'});
      event.watch(function(error, result){
          if (!error) {
            var log = result.logs[0];
            var noEvents = document.getElementById("noEvents");
            if (noEvents) {
              noEvents.parentElement.removeChild(noEvents);
            }
            var newTableRow = document.createElement("tr");
            var newEventAddress = document.createElement("td");
            var newEventName = document.createElement("td");
            var newEventLocation = document.createElement("td");
            var newEventTicketPrice = document.createElement("td");
            newEventAddress.appendChild(document.createTextNode(log.args.eventCreated));
            newEventName.appendChild(document.createTextNode(log.args.eventName));
            newEventLocation.appendChild(document.createTextNode(log.args.eventLocation));
            newEventTicketPrice.appendChild(document.createTextNode(log.args.theTicketPrice)); 
            newTableRow.appendChild(newEventAddress);
            newTableRow.appendChild(newEventName);
            newTableRow.appendChild(newEventLocation);
            newTableRow.appendChild(newEventTicketPrice);
            var tablenode = document.getElementById("theEvents");
            tablenode.appendChild(newTableRow);
          }
        }); 
    })
  }

  
};

window.addEventListener('load', function() {
  // Checking if Web3 has been injected by the browser (Mist/MetaMask)
  if (typeof web3 !== 'undefined') {
    console.warn("Using web3 detected from external source. If you find that your accounts don't appear or you have 0 MetaCoin, ensure you've configured that source properly. If using MetaMask, see the following link. Feel free to delete this warning. :) http://truffleframework.com/tutorials/truffle-and-metamask")
    // Use Mist/MetaMask's provider
    window.web3 = new Web3(web3.currentProvider);
  } else {
    console.warn("No web3 detected. Falling back to http://127.0.0.1:9545. You should remove this fallback when you deploy live, as it's inherently insecure. Consider switching to Metamask for development. More info here: http://truffleframework.com/tutorials/truffle-and-metamask");
    // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
    window.web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:9545"));
  }

  App.start();
});
