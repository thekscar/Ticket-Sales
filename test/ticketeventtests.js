//Pull in contracts
const EventFactory = artifacts.require("./EventFactory.sol");
const TicketSalesHub = artifacts.require("./TicketSalesHub.sol");
const TicketedEvents = artifacts.require("./TicketedEvents.sol");
const randomIntIn = require("../utils/randomIntIn.js");
const toBytes32 = require("../utils/toBytes32.js");

contract('EventFunctions', function(accounts){
  
  let contractFactory; //Instance of factory contract deployed
  let contractHub; //Instance of ticket sales hub deployed
  let contractEvent; //Instance of an event created
  
  let aBigNumber = randomIntIn(10000, 1000000000000);
  let anotherBigNumber = randomIntIn(10000, 1000000000000);
  let aHash = toBytes32(aBigNumber);
  let anotherHash = toBytes32(anotherBigNumber);

  let owner =  accounts[0]; //Hub & applicaiton manager
  let sellerOne = accounts[1]; //Venue
  let buyer = accounts[2]; //Ticket buyer

  /* Steps to take before each test run, deploy contract each time to start
  at same base case. */
  beforeEach(async function(){
    contractFactory = await EventFactory.new({from:owner}); 
    contractHub = await TicketSalesHub.new(contractFactory.address, {from:owner});
    let request = await contractHub.ticketSellerRequest({from:sellerOne});
    let approval = await contractHub.approveTicketSeller(sellerOne, {from:owner});
    let createdEvent = await contractHub.createEventSale("Taylor Swift", "Atlanta, GA", "TSATL", 5000, 500, {from:sellerOne});
    let log = createdEvent.logs[1]; 
    let eAdd = log.args.eventCreated; 
    contractEvent = await TicketedEvents.at(eAdd);
  });

  describe("Buying Tickets", async function(){
      it("Should allow a user to buy a ticket", async function(){
         let purchase = await contractEvent.buyTicket(aHash, {from: buyer, value: 500}); 
         let sold = await contractEvent.totalSold({from:sellerOne});
         let bal = await contractEvent.balanceOfTickets(buyer);
         let tickets = await contractEvent.ticketsOf(buyer);
         let ticketOwner = await contractEvent.ownerOf(1);
         let qr = await contractEvent.qrData(1);
         assert.strictEqual(qr, aHash, "Ticket data not stored properly.");
         assert.strictEqual(ticketOwner, buyer, "Inccorect ticket owner recorded.");
         assert.equal(bal.toNumber(), 1, "Tickets owned by buyer incorrect.");
         assert.equal(bal.toNumber(), 1, "Amount of tickets sold incorrect.");
         assert.equal(sold.toNumber(), 1, "Amount of tickets not correctly sold.");
      })
      it("Should allow a user to buy two tickets", async function(){
          let purchaseOne = await contractEvent.buyTicket(aHash, {from: buyer, value:500});
          let purchaseTwo = await contractEvent.buyTicket(anotherHash, {from:buyer, value:500});
          let sold = await contractEvent.totalSold({from:sellerOne});
          assert.equal(sold, 2, "Amount of tickets not correctly sold.")
      })
  })
});