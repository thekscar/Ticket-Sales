//Pull in contracts
const EventFactory = artifacts.require("./EventFactory.sol");
const TicketSalesHub = artifacts.require("./TicketSalesHub.sol");
const TicketedEvents = artifacts.require("./TicketedEvents.sol");

contract('TicketSales', function(accounts){
  
  let contractFactory; //Instance of factory contract deployed
  let contractHub; //Instance of ticket sales hub deployed

  let owner =  accounts[0]; //Hub & applicaiton manager
  let sellerOne = accounts[1]; //Venue

  /* Steps to take before each test run, deploy contract each time to start
  at same base case. */
  beforeEach(async function(){
    contractFactory = await EventFactory.new({from:owner}); 
    contractHub = await TicketSalesHub.new(contractFactory.address, {from:owner});
  });

  //Contract should be owned by Hub & Applicaiton Manager
  describe("Ownership", async function() {
    it("Should be owned by Hub Manager.", async function(){
      let hubowner = await contractHub.owner({from:owner})
      assert.strictEqual(hubowner, owner, "Contract not owned by Hub Owner.")
    });
    it("Should allow transfer of ownership", async function(){
      let result = await contractHub.transferOwnership(sellerOne, {from:owner});
      let hubowner = await contractHub.owner({from:owner});
      assert.strictEqual(hubowner, sellerOne, "Ownership was tranfered successfully.");
    })
  })

  describe("Requesting", async function(){
    it("Should allow an address to request to be a ticket seller", async function(){
      let result = await contractHub.ticketSellerRequest({from: sellerOne});
      let numReq = await contractHub.numRequesters({from:owner});
      let log = result.logs[0];
      let req = log.args.requestedTicketSeller;
      assert.strictEqual(req, sellerOne, "Address of requester no recorded.")
      assert.equal(numReq.toNumber(), 1, "Incorrect number of requesters recorded, should be one.");
    })
  })

  describe("Approving", async function(){
    it("Should allow owner to approve a requester", async function(){
      let result = await contractHub.ticketSellerRequest({from:sellerOne});
      let resultOne = await contractHub.approveTicketSeller(sellerOne, {from:owner});
      let numReq = await contractHub.numRequesters({from:owner});
      let log = resultOne.logs[0];
      let approved = log.args.newTicketSeller; 
      assert.strictEqual(approved, sellerOne, "Seller One was not approved.");
      assert.equal(numReq.toNumber(), 0, "Incorrect number of requesters, should be zero.");
    })
  })

  describe("Rejecting", async function(){
    it("Should allow owner to reject a requester", async function(){
      let result = await contractHub.ticketSellerRequest({from:sellerOne});
      let resultOne = await contractHub.rejectTicketSeller(sellerOne, {from:owner});
      let numReq = await contractHub.numRequesters({from:owner});
      let log = resultOne.logs[0];
      let rejected = log.args.rejectedTicketSeller; 
      assert.strictEqual(rejected, sellerOne, "Seller One was not rejected.");
      assert.equal(numReq.toNumber(), 0, "Incorrect number of requesters, should be zero.");
    })
  })

  describe("Creating an event", async function(){
    it("Should allow an approved ticket seller to create an event", async function(){
      let result = await contractHub.ticketSellerRequest({from: sellerOne});
      let resultOne = await contractHub.approveTicketSeller(sellerOne, {from: owner});
      let resultTwo = await contractHub.createEventSale("Marc Antony Concert", "Houston, TX", "MATX", 2000, 200, {from: sellerOne});
      //Event data
      let logZero = resultTwo.logs[0];
      let eOwner = logZero.args.newOwner; 
      let log = resultTwo.logs[1];
      let eSeller = log.args.ticketSeller;
      let eAdd = log.args.eventCreated; 
      let eName = log.args.eventName; 
      let eLocation = log.args.eventLocation; 
      let eSym = log.args.eventSymbol; 
      let eTotTickets = log.args.theTotalTicketsAvailable; 
      let ePriceTickets = log.args.theTicketPrice;
      //New contract data
      let newContract = await TicketedEvents.at(eAdd);
      let cOwner = await newContract.owner({from:sellerOne});
      let cName = await newContract.name({from:sellerOne});
      let cLocation = await newContract.location({from:sellerOne});
      let cSym = await newContract.symbol({from:sellerOne});
      let cTotTickets = await newContract.totalTicketsAvailable({from:sellerOne});
      let cPriceTickets = await newContract.ticketPrice({from:sellerOne});
      //Check events emitted
      assert.strictEqual(eOwner, eSeller, "Ownership of new event contract was not set correctly.");
      assert.strictEqual(eSeller, sellerOne, "Seller Incorrectly Set");
      assert.strictEqual(eName, "Marc Antony Concert", "Event name recorded incorrectly.");
      assert.strictEqual(eLocation, "Houston, TX", "Event location recorded incorrectly." );
      assert.strictEqual(eSym, "MATX", "Event symbol recorded incorrectly.");
      assert.equal(eTotTickets.toNumber(), 2000, "Total number of available tickets recorded incorrectly.");
      assert.equal(ePriceTickets.toNumber(), 200, "Incorrect price recorded for ticket price.");
      //Check actual contract created
      assert.strictEqual(cOwner, sellerOne, "Contract owner not set correctly.");
      assert.strictEqual(cName, "Marc Antony Concert", "Contract event name not recorded correctly.");
      assert.strictEqual(cLocation, "Houston, TX", "Contract location not set correctly.");
      assert.strictEqual(cSym, "MATX", "Contract event symbol not set correctly.");
      assert.equal(cTotTickets.toNumber(), 2000, "Contract total tickets not set correctly.");
      assert.equal(cPriceTickets.toNumber(), 200, "Contract ticket price not set correctly.");
    })
  })

});
