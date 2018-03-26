pragma solidity ^0.4.17;

import "./TicketedEvents.sol";
import "./EventFactoryInterface.sol"; 

contract EventFactory is EventFactoryInterface {
    
/*
  * @dev Function for approved ticket sellers to create an event
  * @param _eventName name of event
  * @param _eventLocation location of event
  * @param _eventSymbol similar to an ERC20 token symbol for secondary market (?)
  * @param _totalTicketsAvailable the total number of tickets available for an event
  * @param _theTicketPrice the price of an individual ticket per event
  * ##NOTE## Need to refactor and think about multiple levels of tickets for events - VIP, General Admission, etc. 
*/
    
    function newEventCreation(address _ticketSeller, string _eventName, string _eventLocation, string _eventSymbol, uint256 _totalTicketsAvailable, uint256 _ticketPrice)  
        public
        returns (address eventContract)
        {
            TicketedEvents theCreatedEvent = new TicketedEvents(_eventName, _eventLocation, _eventSymbol, _totalTicketsAvailable, _ticketPrice);
            require(theCreatedEvent.transferOwnership(_ticketSeller));
            return theCreatedEvent; 
        }
}