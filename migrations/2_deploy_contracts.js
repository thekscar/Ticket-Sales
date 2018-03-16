var EventFactory = artifacts.require("./EventFactory.sol");
var TicketSalesHub = artifacts.require("./TicketSalesHub.sol");

module.exports = function(deployer) {
  deployer.deploy(EventFactory).then(function(){
    console.log("Factory address ", EventFactory.address)
    return deployer.deploy(TicketSalesHub, EventFactory.address);
  });

};
