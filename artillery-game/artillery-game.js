Players = new Meteor.Collection('Players');
Arenas = new Meteor.Collection('Arenas');
Shots = new Meteor.Collection('Shots');

if (Meteor.isClient) {
    var gameCreator = game();
    gameCreator.createGame();

    // search for an arena
    var arena = Arenas.findOne({ 'spotsOpen': 1 });

    if (null == arena) {

    }
    else {

    }

    // create player
    //Players.insert({'playerId':meteor.uuid(), 'positionX': });

    // Template.hello.greeting = function () {
    //   return "Welcome to artillery-game.";
    // };

    // Template.hello.events(
    // {
    //     'click input': function ()
    //     {
    //         // template data, if any, is available in 'this'
    //         if (typeof console !== 'undefined')
    //         {
    //             console.log("You pressed the button");
    //         }
    //     }
    // });
}

if (Meteor.isServer) {
    Meteor.startup(function () {
        // code to run on server at startup
    });
}
