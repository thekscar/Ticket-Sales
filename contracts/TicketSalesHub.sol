pragma solidity ^0.4.17; 

/*
 * @title TicketSalesHub
 * Contract hub that would represent company managing the application, selling to 
   venues and artists.
*/

import "./EventFactoryInterface.sol"; 
import "../node_modules/zeppelin-solidity/contracts/ownership/Ownable.sol";
import "../node_modules/zeppelin-solidity/contracts/math/SafeMath.sol";

contract TicketSalesHub is Ownable {

//============================================================================
// LIBRARIES
//============================================================================
    using SafeMath for uint256;

//============================================================================
// GLOBAL VARIABLES
//============================================================================
    
    /* To keep track of a verifier ticket seller based on our contract in case 
    a malicious actor tries to falsify tickets under the guise of another address. */
    
    struct TicketSellers {
        States state;
        address[] sellerEvents;
    }
    
    mapping (address => TicketSellers) public ticketSellers;

    enum States { NotRequested, Requested, Approved, Rejected }
    
    event TicketSellerRequestEvent(address requestedTicketSeller);
    event TicketSellerApprovedEvent(address newTicketSeller);
    event TicketSellerRejectedEvent(address rejectedTicketSeller);
    event TicketEventCreatedEvent(address ticketSeller, address eventCreated, string eventName, string eventLocation, string eventSymbol, uint256 theTotalTicketsAvailable, uint256 theTicketPrice);
    
    //Should I use this as a fail safe to ensure that I could catch all the requestors?
    uint256 public numRequesters;

    //Trusted event factory interface
    EventFactoryInterface f; 

//============================================================================
// MODIFIERS
//============================================================================
    
     modifier onlyApproved() {
        require(ticketSellers[msg.sender].state == States.Approved);
        _; 
    }

//============================================================================
// CONSTRUCTOR
//============================================================================
    /*
     * @dev Constructor function to initiate the TicketSalesHub
     * @param Event factory contract
    */
    function TicketSalesHub(address theFactory) 
        public
        {
            f = EventFactoryInterface(theFactory); 
        }
    
//============================================================================
// TICKET SELLER REQUESTS AND APPROVAL
//============================================================================
    
/*
  * @dev Function for a ticket seller (artist or venue) to become an approved seller through the platform
  * @param _from address representing the previous owner of the given token ID
  * @param _tokenId uint256 ID of the token to be removed from the tokens list of the given address
*/
    function ticketSellerRequest() 
        public
        returns(bool)
        {
            /* To think about for the future, should an address be able to re-request ticket 
            seller status? How to include a verification that this address is who they say they 
            are? (i.e. The address for MinuteMaid Stadium is as claimed to be?)*/
            require(ticketSellers[msg.sender].state == States.NotRequested);
            ticketSellers[msg.sender].state = States.Requested; 
            TicketSellerRequestEvent(msg.sender);
            numRequesters = numRequesters.add(1); 
            return true;
        }

/*
  * @dev Function for the owner of hub to approve a ticket seller
  * @param requester address of ticket seller
*/
    function approveTicketSeller(address requester)
        public
        onlyOwner
        returns (bool)
        {
            require(requester != 0x0);
            require(ticketSellers[requester].state == States.Requested);
            ticketSellers[requester].state = States.Approved;
            TicketSellerApprovedEvent(requester);
            numRequesters = numRequesters.sub(1);
            return true;
        }
/*
  * @dev Function for the owner of hub to reject a ticket seller
  * @param requester address of ticket seller
*/
    function rejectTicketSeller(address requester)
        public
        onlyOwner
        returns (bool)
        {
            require(requester != 0x0);
            require(ticketSellers[requester].state == States.Requested);
            ticketSellers[requester].state = States.Rejected;
            TicketSellerRejectedEvent(requester);
            numRequesters = numRequesters.sub(1);
            return true;
        }
    
//============================================================================
// TICKET SELLER EVENT CREATION
//============================================================================

/*
  * @dev Function for approved ticket sellers to create an event
  * @param requester address of ticket seller
*/
    
    function createEventSale(string _eventName, string _eventLocation, string _eventSymbol, uint256 _totalTicketsAvailable, uint256 _theTicketPrice)
        public
        onlyApproved
        returns (address newEvent)
        {
            address theCreatedEvent = f.newEventCreation(msg.sender, _eventName, _eventLocation, _eventSymbol, _totalTicketsAvailable, _theTicketPrice);
            require(theCreatedEvent != 0x0);
            TicketEventCreatedEvent(msg.sender, theCreatedEvent, _eventName, _eventLocation, _eventSymbol, _totalTicketsAvailable, _theTicketPrice);
            return theCreatedEvent; 
        }
    
//============================================================================
// CONSTANT/VIEW FUNCTION CHECKS
//============================================================================

    function isApprovedSeller(address tocheck)
        public
        view
        returns (bool isSeller)
        {
            return ticketSellers[tocheck].state == States.Approved;
        }
    
    function isRequestedSeller(address tocheck)
        public
        view
        returns (bool isRequested)
        {
            return ticketSellers[tocheck].state == States.Requested;
        }
    
    function isRejectedSeller(address tocheck)
        public
        view
        returns (bool isRejected)
        {
            return ticketSellers[tocheck].state == States.Rejected;
        }
    
    function ticketSellerStatus (address tocheck)
        public
        view
        returns (States status)
        {
            return ticketSellers[tocheck].state; 
        }
    
    function howManyRequests()
        public
        view
        returns (uint256 howMany)
        {
            return numRequesters;
        }

}