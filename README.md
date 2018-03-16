# Ticket-Sales-on-Ethereum
A ticket sales application for events powered by smart contracts on Ethereum. (Work in progress). 

This application uses smart contracts on Ethereum to model ticket sales to an event. In this design, an application manager (owner of the central hub smart contract) can approve a ticket seller or vendor. The ticket seller can then use an ERC721 factory to produce a specific ERC721 contract for tickets sales to a particular event. Tickets were modeled this way as ERC721 can contain metadata for each specific "ticket" or token. Once an event is created by a ticket seller, ticket buyers are able to purchase tickets/tokens.

To launch this application, ensure Truffle and [Ganache](http://truffleframework.com/ganache/) are installed. [Windows Truffle Install Instructions Here](http://truffleframework.com/tutorials/how-to-install-truffle-and-testrpc-on-windows-for-blockchain-development) 

First, clone or copy this respositrory to your computer, and from the command window in the folder run `npm install` to install dependancies. Then, start up Ganache to have a running test chain. Next, run `truffle migrate` to deploy the contracts onto the blockchain - EventFactory.sol will be deployed first, followed by TicketSalesHub.sol. 

Then, run `npm run dev`. Webpack will build and serve the application.

Then, using Chrome or [Brave](https://brave.com/), with [MetaMask](https://metamask.io/) connect to your Ganache by connecting to http://localhost:7545. (If this is your first time using MetaMask with Ganache you will need to create a Custom RPC for this.) Then, use your 12 word mnemonic to connect to Ganache instance. Now, you can access http://localhost:8080/ to connect to the application. You can alternate roles through MetaMask - Application Manager (your coinbase account), Ticket Buyer, Ticket Seller (must request approval from Application Manager). You will see MetaMask only shows the first account from Ganache - in order to get additional Ganache accounts, select "Create Account" and accounts from Ganache will be pulled in deterministically. 

Reminder: You can access the console log via F12 to see potential error messages.

##To Do 
* Improve front end mechanics. 
* Add use of ERC20 for ticket purchase as volatility of Ether disincentivises spending it on purchases.  
* Improve work flow of ticket purchase for multiple buyers/users. 
