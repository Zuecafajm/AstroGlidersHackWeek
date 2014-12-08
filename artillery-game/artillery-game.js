Players = new Meteor.Collection('Players');
Arenas = new Meteor.Collection('Arenas');
Shots = new Meteor.Collection('Shots');

if (Meteor.isClient)
{
    var gameCreator = game();
    gameCreator.createGame(); 
}

if (Meteor.isServer) {
    Meteor.startup(function () {
        // code to run on server at startup
    });
}