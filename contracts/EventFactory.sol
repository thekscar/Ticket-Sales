pragma solidity ^0.4.17;

import "./TicketedEvents.sol";
import "./EventFactoryInterface.sol"; 

contract EventFactory is EventFactoryInterface {
    
    event LogNewEvent(address ticketSeller, address newEvent);
    
    function newEventCreation(address _ticketSeller, string _eventName, string _eventLocation, string _eventSymbol, uint256 _totalTicketsAvailable, uint256 _ticketPrice)  
        public
        returns (address eventContract)
        {
            TicketedEvents theCreatedEvent = new TicketedEvents(_eventName, _eventLocation, _eventSymbol, _totalTicketsAvailable, _ticketPrice);
            require(theCreatedEvent.transferOwnership(_ticketSeller));
            return theCreatedEvent; 
        }
}