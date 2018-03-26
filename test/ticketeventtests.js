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
  let oneMoreBigNumber = randomIntIn(10000, 1000000000000);
  let aHash = toBytes32(aBigNumber);
  let anotherHash = toBytes32(anotherBigNumber);
  let oneMoreHash = toBytes32(oneMoreBigNumber);

  let owner =  accounts[0]; //Hub & applicaiton manager
  let sellerOne = accounts[1]; //Venue
  let buyer = accounts[2]; //Ticket buyer one
  let anotherbuyer = accounts[3]; //Ticket buyer two

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
         let log = purchase.logs[0];
         let theindex = log.args._newTicketId; 
         let sold = await contractEvent.totalSold({from:sellerOne});
         let bal = await contractEvent.balanceOfTickets(buyer);
         let tickets = await contractEvent.ticketsOf(buyer);
         let ticketindex = tickets[0]; 

         let ticketOwner = await contractEvent.ownerOf(ticketindex);
         let qr = await contractEvent.qrData(ticketindex.toNumber());
         assert.strictEqual(qr, aHash, "Ticket data not stored properly.");
         assert.strictEqual(ticketOwner, buyer, "Inccorect ticket owner recorded.");
         assert.equal(bal.toNumber(), 1, "Tickets owned by buyer incorrect.");
         assert.equal(sold.toNumber(), 1, "Amount of tickets not correctly sold.");
         assert.equal(ticketindex.toNumber(), 0, "Incorrect ticket index assigned"); 
      })

      it("Should allow a user to buy two tickets", async function(){
          let purchaseOne = await contractEvent.buyTicket(aHash, {from: buyer, value:500});
          let purchaseTwo = await contractEvent.buyTicket(anotherHash, {from:buyer, value:500});
          let logOne = purchaseOne.logs[0]; 
          let ticketOneIndex = logOne.args._newTicketId; 
          let logTwo = purchaseTwo.logs[0]; 
          let ticketTwoIndex = logTwo.args._newTicketId; 
          let sold = await contractEvent.totalSold({from:sellerOne});
          let tickets = await contractEvent.ticketsOf(buyer);
          let ticketOne = tickets[0]; 
          let ticketTwo = tickets[1]; 
          assert.equal(ticketOne.toNumber(), ticketOneIndex.toNumber(), "Incorrect ticket one sold.");
          assert.equal(ticketTwo.toNumber(), ticketTwoIndex.toNumber(), "Incorrect ticket 2 sold.")
          assert.equal(ticketOne.toNumber(), 0, "Incorrect ticket id for one.");
          assert.equal(ticketTwo.toNumber(), 1, "Incorrect ticket id for two."); 
          assert.equal(sold, 2, "Amount of tickets not correctly sold.")
      })
  })

  describe("Refunding Tickets", async function(){
    it("Should allow user to request a refund", async function(){
      let result = await contractEvent.buyTicket(aHash, {from:buyer, value:500});
      let resultOne = await contractEvent.requestRefund(0, {from:buyer});
      let resultTwo = await contractEvent.isRefundRequested(0);
      let log = resultOne.logs[0]; 
      let refundRequester = log.args.buyer; 
      let ticketToRefund = log.args._refundTicketId; 
      assert.strictEqual(refundRequester, buyer, "Incorrect requester recorded.");
      assert.equal(ticketToRefund.toNumber(), 0, "Wrong ticket id to refund recorded.")
      assert.isTrue(resultTwo, "Refund request not recorded.")
    })
    it("Should allow ticket seller to approve a refund - single ticket", async function(){
      let result = await contractEvent.buyTicket(aHash, {from: buyer, value:500});
      let resultOne = await contractEvent.requestRefund(0, {from: buyer});
      let resultTwo = await contractEvent.approveRefund(0, {from:sellerOne});
      let tickets = await contractEvent.ticketsOf(buyer);
      assert.lengthOf(tickets, 0, "Ticket has not been removed from original buyer");
    })
    it("Should allow ticket seller to refund - two tickets, one refund, first ticket", async function(){
      let purchaseOne = await contractEvent.buyTicket(aHash, {from: buyer, value:500});
      let purchaseTwo = await contractEvent.buyTicket(anotherHash, {from:buyer, value:500});
      let resultOne = await contractEvent.requestRefund(0, {from: buyer});
      let resultTwo = await contractEvent.approveRefund(0, {from: sellerOne});
      let tickets = await contractEvent.ticketsOf(buyer);
      let totalAval = await contractEvent.totalSupply({from:sellerOne});
      let bal = await contractEvent.balanceOfTickets(buyer);
      let qr = await contractEvent.qrData(1); 
      assert.strictEqual(qr, anotherHash, "Incorrect ticket retained.")
      assert.equal(bal.toNumber(), 1, "Incorrect ticket balance recorded.");
      assert.lengthOf(tickets, 1, "Ticket has not been refunded properly.");
      assert.equal(tickets[0].toNumber(), 1, "Incorrect ticket index kept.")
      assert.equal(totalAval.toNumber(), 4999, "Refunded ticket not reincluded in total stack.")
    })
    it("Should allow ticket seller to refund - two tickets, one refund, second ticket.", async function(){
      let purchaseOne = await contractEvent.buyTicket(aHash, {from: buyer, value:500});
      let purchaseTwo = await contractEvent.buyTicket(anotherHash, {from:buyer, value:500});
      let resultOne = await contractEvent.requestRefund(1, {from: buyer});
      let resultTwo = await contractEvent.approveRefund(1, {from: sellerOne});
      let tickets = await contractEvent.ticketsOf(buyer);
      let totalAval = await contractEvent.totalSupply({from:sellerOne});
      let bal = await contractEvent.balanceOfTickets(buyer);
      let qr = await contractEvent.qrData(0);
      assert.strictEqual(qr, aHash, "Incorrect ticket retained.")
      assert.equal(bal.toNumber(), 1, "Incorrect ticket balance recorded.");
      assert.lengthOf(tickets, 1, "Ticket has not been refunded properly.");
      assert.equal(tickets[0].toNumber(), 0, "Incorrect ticket index kept.")
      assert.equal(totalAval.toNumber(), 4999, "Refunded ticket not reincluded in total stack.") 
    })
    it("Should allow ticket seller to refund - three tickets, one refund, middle ticket.", async function(){
      let purchaseOne = await contractEvent.buyTicket(aHash, {from: buyer, value:500});
      let purchaseTwo = await contractEvent.buyTicket(anotherHash, {from:buyer, value:500});
      let purchaseThree = await contractEvent.buyTicket(oneMoreHash, {from:buyer, value:500});
      let resultOne = await contractEvent.requestRefund(1, {from: buyer});
      let resultTwo = await contractEvent.approveRefund(1, {from: sellerOne});
      let tickets = await contractEvent.ticketsOf(buyer);
      let totalAval = await contractEvent.totalSupply({from:sellerOne});
      let bal = await contractEvent.balanceOfTickets(buyer);
      assert.equal(bal.toNumber(), 2, "Incorrect ticket balance recorded.");
      assert.lengthOf(tickets, 2, "Ticket has not been refunded properly.");
      assert.equal(tickets[0].toNumber(), 0, "Incorrect ticket index kept for first ticket.");
      assert.equal(tickets[1].toNumber(), 2, "Incorrect ticket index kept for second ticket.");
      assert.equal(totalAval.toNumber(), 4998, "Refunded ticket not reincluded in total stack.");
    })
  })

  describe("Transferring tickets from one buyer to another", async function(){
    it("Should allow a ticket owner to approve another buyer or contract to take ownership", async function(){
      let purchaseOne = await contractEvent.buyTicket(aHash, {from: buyer, value:500});
      let approval = await contractEvent.approve(anotherbuyer, 0, {from:buyer});
      let checkApproved = await contractEvent.approvedFor(0);
      let log = approval.logs[0];
      let originalBuyer = log.args.buyer; 
      let approvedAdd = log.args._approvedAddress; 
      let approvedTicketId = log.args._theTicketId; 
      assert.strictEqual(originalBuyer, buyer, "Original buyer recorded incorrectly in event.");
      assert.strictEqual(approvedAdd, anotherbuyer, "Approved address recorded incorrectly in event.");
      assert.equal(approvedTicketId.toNumber(), 0, "Approved ticket id recorded incorrectly.");
      assert.strictEqual(checkApproved, anotherbuyer, "Wrong or incorrect address approved.");
    })
    it("Should allow an approved address to take ownership of a ticket", async function(){
      let purchaseOne = await contractEvent.buyTicket(aHash, {from: buyer, value:500});
      let approval = await contractEvent.approve(anotherbuyer, 0, {from:buyer});
      let taken = await contractEvent.takeOwnership(0, {from:anotherbuyer}); 
      let tickets = await contractEvent.ticketsOf(anotherbuyer);
      let ticketsOriginal = await contractEvent.ticketsOf(buyer);
      let log = taken.logs[0];
      let newOwner = log.args._newOwner; 
      let idTransferred = log.args._transferredTicket; 
      assert.equal(tickets[0].toNumber(), 0, "Approved address was not able to claim ownership");
      assert.lengthOf(ticketsOriginal, 0, "Ticket not removed from original owner.")
      assert.strictEqual(newOwner, anotherbuyer, "Address of new owner not correct in event.");
      assert.equal(idTransferred.toNumber(), 0, "Ticket id transferred in event, not correct.");
    })
  })

  describe("Checking ticket indexing with refunds and transfers", async function(){
    it("Should keep indexing incrementally even after refunds", async function(){
      let result = await contractEvent.buyTicket(aHash, {from: buyer, value:500});
      let resultOne = await contractEvent.requestRefund(0, {from: buyer});
      let resultTwo = await contractEvent.approveRefund(0, {from:sellerOne});
      let resultThree = await contractEvent.buyTicket(aHash, {from:buyer, value:500});
      let tickets = await contractEvent.ticketsOf(buyer);
      //We have deleted the ticket at index zero, so next ticket bought should have an index of 1.
      assert.equal(tickets[0].toNumber(), 1, "Incorrect indexing for next bought ticket."); 
    })
  })

});