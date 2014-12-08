Players = new Meteor.Collection('Players');
Arenas = new Meteor.Collection('Arenas');
Shots = new Meteor.Collection('Shots');

if (Meteor.isClient) {
    
    window.setTimeout(ArenasReady, 1000);

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

    Meteor.publish('onReady', serverFunction);
}

function serverFunction() {
    console.log("got subscriber");
}

function ArenasReady() {
    // search for an arena
    var arena = Arenas.findOne({ playerCount: 1 });

    if (null == arena) {
        // we don't find an already open arena, create one
        Arenas.insert({ playerCount: 0 });
        arena = Arenas.findOne({ playerCount: 0 });

        console.log("didn't find one");
    }

    arena.playerCount++;

    Arenas.update({ _id: arena._id }, { $set: { playerCount: arena.playerCount } });

    CreatePlayer(arena);
}

function CreatePlayer(arena)
{
    var gameCreator = game();
    gameCreator.createGame();

    window.setTimeout(GameReady, 1000, gameCreator, arena);
}

function GameReady(gameCreator, arena) {
    if (arena.playerCount == 1) {
        // player 1
        gameCreator.PlacePlayer(1);
    }
    else if (arena.playerCount == 2) {
        // player 2
        gameCreator.PlacePlayer(1);
        gameCreator.PlacePlayer(2);
    }
    else {
        console.log("This arena already has two players");
    }
}