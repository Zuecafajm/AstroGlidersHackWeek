Players = new Meteor.Collection('Players');
Matches = new Meteor.Collection('Matches');
Actions = new Meteor.Collection('Actions');
Shots = new Meteor.Collection('Shots');
Connections = new Meteor.Collection('Connections');

if (Meteor.isClient) {
    window.setTimeout(Start, 1000);
}

function Start() {
    if (Meteor.isClient) {
        var gameCreator = game();
        gameCreator.createGame();
    }
}

if (Meteor.isServer) {
    Meteor.startup(function () {
        // code to run on server at startup
    });
}
