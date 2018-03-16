/* Event Factory in which ERC721's would represent tickets to an event. */

pragma solidity ^0.4.17;

/*
 * @title Event Factory.
 * Event Factory in which ERC721's would represent tickets to an event.
*/
import "../node_modules/zeppelin-solidity/contracts/ownership/Ownable.sol";
import '../node_modules/zeppelin-solidity/contracts/math/SafeMath.sol';


contract TicketedEvents is Ownable {
//============================================================================
// LIBRARIES
//============================================================================
  using SafeMath for uint256;

//============================================================================
// GLOBAL VARIABLES
//============================================================================

  // Total amount of tickets avail to be sold
  uint256 private totalTicketsAvailable;
  // Total tickets sold so far
  uint private totalTicketsSold;
  // Mapping from ticket ID to owner
  mapping (uint256 => address) private ticketOwner;
  // Mapping from ticket ID to approved address
  mapping (uint256 => address) private ticketApprovals;
  // Mapping from owner to list of owned ticket IDs
  mapping (address => uint256[]) private ownedTickets;
  // Mapping from ticket ID to index of the owner tokens list
  mapping(uint256 => uint256) private ownedTicketsIndex;
  //Name of Event
  string public name;
  //Location of Event 
  string public location;
  //Symbol of Event - Assuming even with planning these tokens will end up on some sort of secondary market
  string public symbol;
  //Ticket price
  uint256 public ticketPrice; 
  
  //Tracking the data of each ticket
  struct Tickets {
      bytes32 qrData;
      uint256 numOfTransfers;
  }
  Tickets[] private tickets;
  
//============================================================================
// MODIFIERS
//============================================================================

  /*
  * @dev Guarantees msg.sender is owner of the given token
  * @param _tokenId uint256 ID of the token to validate its ownership belongs to msg.sender
  */
  modifier onlyOwnerOf(uint256 _ticketId) {
    require(ownerOf(_ticketId) == msg.sender);
    _;
  }

//============================================================================
// CONSTRUCTOR
//============================================================================

  /* Constructor to initiate event ERC721's. */
  function TicketedEvents(string _name, string _location, string _symbol, uint256 _ticketsAvailable, uint256 _ticketPrice)
    public 
    {
      name = _name;
      location = _location;
      symbol = _symbol;
      totalTicketsAvailable = _ticketsAvailable; 
      ticketPrice = _ticketPrice; 
    }
 
//============================================================================
// CONSTANT/VIEW FUNCTIONS
//============================================================================
 
  /*
  * @dev Gets the total amount of tickets available to be sold
  * @return uint256 representing the total amount of tickets available
  */
  function totalSupply() public view returns (uint256) {
    return totalTicketsAvailable;
  }
  
  /* 
  * @ dev Gets the total amount of tickets sold so far
  * @ return uint256 representing total amount of tickets sold
  */
  
  function totalSold() public view returns (uint256) {
      return totalTicketsSold;
  }

  /*
  * @dev Gets the balance of tickets of the specified address
  * @param _owner address to query the balance of tickets of 
  * @return uint256 representing the number of tickets owned by the passed address
  */
  function balanceOfTickets(address _owner) public view returns (uint256) {
    return ownedTickets[_owner].length;
  }

  /*
  * @dev Gets the list of ticket IDs owned by a given address
  * @param _owner address to query the tickets of
  * @return uint256[] representing the list of tickets owned by the passed address
  */
  function ticketsOf(address _owner) public view returns (uint256[]) {
    return ownedTickets[_owner];
  }

  /*
  * @dev Gets the owner of the specified ticket ID
  * @param _ticketId uint256 ID of the ticket to query the owner of
  * @return owner address currently marked as the owner of the given ticket ID
  */
  function ownerOf(uint256 _ticketId) public view returns (address) {
    address owner = ticketOwner[_ticketId];
    require(owner != address(0));
    return owner;
  }

  function qrData(uint256 _ticketId) public view returns (bytes32) {
    bytes32 data = tickets[_ticketId.sub(1)].qrData;
    require(data != 0);
    return data; 
  }

  /*
   * @dev Gets the approved address to take ownership of a given token ID
   * @param _tokenId uint256 ID of the token to query the approval of
   * @return address currently approved to take ownership of the given token ID
   */
  function approvedFor(uint256 _ticketId) public view returns (address) {
    return ticketApprovals[_ticketId];
  }
  
  /*
   * @dev Tells whether the msg.sender is approved for the given ticket ID or not
   * This function is not private so it can be extended in further implementations like the operatable ERC721
   * @param _owner address of the owner to query the approval of
   * @param _tokenId uint256 ID of the token to query the approval of
   * @return bool whether the msg.sender is approved for the given token ID or not
  */
  function isApprovedFor(address _owner, uint256 _ticketId) internal view returns (bool) {
    return approvedFor(_ticketId) == _owner;
  }

//============================================================================
// TICKET TRANSFERING FUNCTIONS (TICKET SELLER)
//============================================================================

  /*
  * @dev Transfers the ownership of a given ticket ID to another address
  * @param _to address to receive the ownership of the given ticket ID
  * @param _ticketId uint256 ID of the token to be transferred
  */
  function _transfer(address _to, uint256 _ticketId) internal onlyOwnerOf(_ticketId) {
    clearApprovalAndTransfer(msg.sender, _to, _ticketId);
  }
  
  /*
  * @dev Allows third party to buy a ticket
  * @param Information for a ticket to buy (should be handled by front end)
  * @return Ticket Id created & given to msg.sender
  */
  function buyTicket(bytes32 _ticketToBuy) public payable returns (uint256 ticketId) {
      require(msg.value == ticketPrice);
      uint256 newId = _mint(msg.sender, _ticketToBuy);
      return newId;
  }

  /*
  * @dev Mint ticket function
  * @param _to The address that will own the minted ticket
  * @param _ticketId uint256 ID of the ticket to be minted by the msg.sender
  */
  function _mint(address _to, bytes32 _qrData) internal returns (uint256 _newTicketId) {
    require(_to != address(0));
    Tickets memory _tickets = Tickets({
        qrData: _qrData,
        numOfTransfers: 1
      });
    uint256 newTicketId = tickets.push(_tickets);
    addTicket(msg.sender, newTicketId);
    return newTicketId;
  }

  /*
  * @dev Internal function to add a token ID to the list of a given address
  * @param _to address representing the new owner of the given token ID
  * @param _tokenId uint256 ID of the token to be added to the tokens list of the given address
  */
  function addTicket(address _to, uint256 _ticketId) private {
    require(ticketOwner[_ticketId] == address(0));
    ticketOwner[_ticketId] = _to;
    uint256 length = balanceOfTickets(_to);
    ownedTickets[_to].push(_ticketId);
    ownedTicketsIndex[_ticketId] = length;
    totalTicketsSold = totalTicketsSold.add(1);
  }

//============================================================================
// TICKET DESTORYING FUNCTIONS (TICKET RETURNS(?))
//============================================================================

  /*
  * @dev Burns a specific token
  * @param _tokenId uint256 ID of the token being burned by the msg.sender
  */
  function _burn(uint256 _ticketId) onlyOwnerOf(_ticketId) internal {
    if (approvedFor(_ticketId) != 0) {
      clearApproval(msg.sender, _ticketId);
    }
    removeTicket(msg.sender, _ticketId);
  }

  
  /*
  * @dev Internal function to remove a token ID from the list of a given address
  * @param _from address representing the previous owner of the given token ID
  * @param _tokenId uint256 ID of the token to be removed from the tokens list of the given address
  */
  function removeTicket(address _from, uint256 _ticketId) private {
    require(ownerOf(_ticketId) == _from);

    uint256 ticketIndex = ownedTicketsIndex[_ticketId];
    uint256 lastTicketIndex = balanceOfTickets(_from).sub(1);
    uint256 lastTicket = ownedTickets[_from][lastTicketIndex];

    ticketOwner[_ticketId] = 0;
    ownedTickets[_from][ticketIndex] = lastTicket;
    ownedTickets[_from][lastTicketIndex] = 0;
    // Note that this will handle single-element arrays. In that case, both tokenIndex and lastTokenIndex are going to
    // be zero. Then we can make sure that we will remove _tokenId from the ownedTokens list since we are first swapping
    // the lastToken to the first position, and then dropping the element placed in the last position of the list

    ownedTickets[_from].length--;
    ownedTicketsIndex[_ticketId] = 0;
    ownedTicketsIndex[lastTicket] = ticketIndex;
    totalTicketsAvailable = totalTicketsAvailable.sub(1);
  }


//============================================================================
// TICKET TRANSFERING FUNCTIONS (SECONDARY MARKET) - TBA
//============================================================================

  /*
  * @dev Approves another address to claim for the ownership of the given ticket ID
  * @param _to address to be approved for the given token ID
  * @param _tokenId uint256 ID of the token to be approved
  */
  function approve(address _to, uint256 _ticketId) public onlyOwnerOf(_ticketId) {
    address owner = ownerOf(_ticketId);
    require(_to != owner);
    if (approvedFor(_ticketId) != 0 || _to != 0) {
      ticketApprovals[_ticketId] = _to;
    }
  }

  /*
  * @dev Claims the ownership of a given ticket ID
  * @param _ticketId uint256 ID of the ticket being claimed by the msg.sender
  */
  function takeOwnership(uint256 _ticketId) public {
    require(isApprovedFor(msg.sender, _ticketId));
    clearApprovalAndTransfer(ownerOf(_ticketId), msg.sender, _ticketId);
  }
  
  /*
  * @dev Internal function to clear current approval and transfer the ownership of a given ticket ID
  * @param _from address which you want to send tokens from
  * @param _to address which you want to transfer the token to
  * @param _tokenId uint256 ID of the token to be transferred
  */
  function clearApprovalAndTransfer(address _from, address _to, uint256 _ticketId) internal {
    require(_to != address(0));
    require(_to != ownerOf(_ticketId));
    require(ownerOf(_ticketId) == _from);

    clearApproval(_from, _ticketId);
    removeTicket(_from, _ticketId);
    addTicket(_to, _ticketId);
  }

  /*
  * @dev Internal function to clear current approval of a given ticket ID
  * @param _ticketId uint256 ID of the token to be transferred
  */
  function clearApproval(address _owner, uint256 _ticketId) private {
    require(ownerOf(_ticketId) == _owner);
    ticketApprovals[_ticketId] = 0;
  }

}