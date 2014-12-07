Stars = new Meteor.Collection('Stars');

if (Meteor.isClient) 
{  
  var gameCreator = game();  
  gameCreator.createGame();
  
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

if (Meteor.isServer) 
{
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
