window.AstroGliders = window.AstroGliders || {};

var gameWidth = 1280;
var gameHeight = 720;

ActionTypeEnum = {
    PlayerConnect : "PlayerConnect",
    PlayerShoot : "PlayerShoot"
}

game = function () {
    var game;
    var platforms;

    var score = 0;
    var scoreText;

    var waitingForPlayerText;

    function preload() {
        game.load.image('ground', '/assets/platform.png');
        game.load.image('sky', '/assets/sky.png');
        game.load.image('star', '/assets/star.png');
        game.load.image('diamond', '/assets/diamond.png');
    }

    function create() {
        game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;

        SetupWorld();

        //player1 = AstroGliders.Tank(32, game.world.height - 150, -Math.PI / 2, game);
        //player2 = AstroGliders.Tank(1200, game.world.height - 150, Math.PI / 2, game);

        //  The score
        // scoreText = game.add.text(16, 16, 'score: 0', { fontSize: '32px', fill: '#000' });
        FindMatch();
    }

    function FindMatch() {
        // search for an match
        var matches = Matches.find({ playerCount: 1 });

        if (null == matches || matches.fetch().length == 0) {
            // we don't find an already open match, create one
            Matches.insert({ playerCount: 0, activePlayerId: 0, players: [] });
            matches = Matches.find({ playerCount: 0 });
            
            console.log("didn't find one");
        }

        var match = matches.fetch()[0];

        Actions.find({ matchId: match._id }).observe({ added: function (item) { ActionOccured(match._id, item) } });

        match.playerCount++;

        var player;

        if (match.playerCount == 1) {
            player = SetupPlayerDB(match, "Stu", true);
        }
        else {
            player = SetupPlayerDB(match, "Aaron", false);
        }

        console.log("Number of players in the match: " + match.playerCount.toString());

        match.players.push(player);

        Matches.update({ _id: match._id }, { $set: { playerCount: match.playerCount, players: match.players } });
        Actions.insert({ matchId: match._id, actionType: ActionTypeEnum.PlayerConnet });
    }

    function SetupPlayerDB(match, playerName, turn) {
        player = Players.findOne({ name: playerName });

        if (player == null) {
            // player wasn't found, add to the database
            player = Players.insert({ name: playerName, playerNumber: match.playerCount, playersTurn: turn });
        }
        else {
            // player's already in the database, modify record with new game
            Players.update({ _id: player._id }, { $set: { name: playerName, playerNumber: match.playerCount, playersTurn: turn } });
        }

        return player;
    }

    function ActionOccured(matchId, actionItem) {
        
        console.log("Action occured, match id: " + matchId);

        var match = Matches.find({ _id : matchId }).fetch()[0];

        if (match.playerCount == 1) {
            // only have one player, throw up a message about waiting for the other

            waitingForPlayerText = game.add.text(16, 16, 'Waiting for other player to join', { fontSize: '32px', fill: '#000' });
        }
        else if (match.playerCount == 2) {
            // got two players, start game

            waitingForPlayerText = null;

            //Meteor.publish("ReadyToPlay", function () { });

            SpawnPlayers(match);
        }
        else {
            console.log("Somehow we got too many players: " + match.playerCount.toString());
        }
    }

    function SpawnPlayers(match)
    {
        console.log("Spawn our players");
    }

    function CreatePlayer()
    {
        var posY = gameHeight - 150;

        var posX;
        var rotation;

        if (playerNumber == 1) {
            posX = gameWidth / 8.0;
            rotation = -Math.PI / 2;
        }
        else {
            posX = gameWidth / 8.0 * 7
            rotation = Math.PI / 2;
        }

        players = AstroGliders.Tank(posX, posY, rotation, game);
    }



    function StartGame() {
        console.log("starting game");
    }

    function SetupWorld() {
        //  We're going to be using physics, so enable the Arcade Physics system
        game.physics.startSystem(Phaser.Physics.ARCADE);

        //  A simple background for our game
        var sky = game.add.sprite(0, 0, 'sky');

        sky.scale.setTo(2, 1.1);

        //  The platforms group contains the ground and the 2 ledges we can jump on
        platforms = game.add.group();

        //  We will enable physics for any object that is created in this group
        platforms.enableBody = true;

        // Here we create the ground.
        var ground = platforms.create(0, game.world.height - 64, 'ground');

        //  Scale it to fit the width of the game (the original sprite is 400x32 in size)
        ground.scale.setTo(4, 2);

        //  This stops it from falling away when you jump on it
        ground.body.immovable = true;
    }

    function update() {

        //  Collide the player and the stars with the platforms
        //game.physics.arcade.collide(player1, platforms);
        //game.physics.arcade.collide(player2, platforms);

        //player1.Update(player2, platforms);
        //player2.Update(player1, platforms);
    }

    /**
    * Public methods
    */
    return {
        /**
        * Create game.
        */
        createGame: function () {
            game = new Phaser.Game(gameWidth, gameHeight, Phaser.AUTO, '',
            {
                preload: preload,
                create: create,
                update: update
            });
        }
    };
}