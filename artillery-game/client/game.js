window.AstroGliders = window.AstroGliders || {};

var gameWidth = 1280;
var gameHeight = 720;

ActionTypeEnum = {
    PlayerConnect: "PlayerConnect",
    PlayerShoot: "PlayerShoot",
    PlayerDisconnect: "PlayerDisconnect",
    GameOver: "GameOver",
    NewMatch: "NewMatch"
}

game = function () {
    var game;
    var platforms;

    var score = 0;
    var scoreText;

    var isMyTurn;
    var gameOverText;
    var waitingForPlayerText;

    var matchId;
    var playerId;
    var playerTank;

    var playerName;
    var otherPlayerName;

    var playersTurnId;

    var gameStarted;
    var otherPlayerDone;

    var windText;
    var scoreText;

    var totalScore;

    function preload() {
        game.load.image('ground', '/assets/platform.png');
        game.load.image('sky', '/assets/sky.png');
        game.load.image('star', '/assets/cat.png');
        game.load.image('diamond', '/assets/diamond.png');
    }

    function create() {
        game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        game.stage.disableVisibilityChange = true;

        SetupWorld();

        //  The score
        // scoreText = game.add.text(16, 16, 'score: 0', { fontSize: '32px', fill: '#000' });
        FindMatch();
    }

    function FindMatch() {
        // search for an match
        var matches = Matches.find({ playerCount: 1 });

        if (null == matches || matches.fetch().length == 0) {
            // we don't find an already open match, create one
            Matches.insert({ playerCount: 0, playerIds: [], score : [] });
            matches = Matches.find({ playerCount: 0 });
        }

        var match = matches.fetch()[0];

        matchId = match._id;

        Actions.find({ matchId: match._id }).observe({ added: function (item) { ActionOccured(match._id, item) } });

        match.playerCount++;

        totalScore = 0;

        var player;

        if (match.playerCount == 1) {
            playerName = "Stu";
            player = SetupPlayerDB(1, true);
        }
        else {
            playerName = "Aaron";
            player = SetupPlayerDB(2, false);
        }

        playerId = player._id;
        match.playerIds.push(player._id);

        var scores = [];

        for (i = 0; i < match.playerIds.length; ++i) {
            scores.push({ playerId: match.playerIds[i], score: 0 });
        }

        Matches.update({ _id: match._id }, { $set: { playerCount: match.playerCount, playerIds: match.playerIds, score: scores } });
        Actions.insert({ matchId: matchId, actionType: ActionTypeEnum.PlayerConnect });
    }

    function SetupPlayerDB(playerNumber, turn) {
        var posY = game.world.height - 78;

        var posX;
        var rotation;

        if (playerNumber == 1) {
            posX = gameWidth / 8.0;
            rotation = -Math.PI / 2;

            // player 1 gets to decide the wind for the match
            var maxWind = (20 + 10 * Math.min(totalScore, 8));
            var wind = Math.round(Math.random() * maxWind * 2 - maxWind);
            Matches.update({ _id: matchId }, { $set: { wind: wind } });
        }
        else {
            posX = gameWidth / 8.0 * 7
            rotation = Math.PI / 2;
        }

        // adjust the position so it isn't the same every time
        posX += Math.random() * 200 - 100

        player = Players.find({ name: playerName }).fetch()[0];

        if (player == null) {
            // player wasn't found, add to the database
            playerId = Players.insert({ name: playerName, positionX: posX, positionY: posY, rotation: rotation, playerNumber: playerNumber });
            player = Players.find({ _id: playerId }).fetch()[0];
        }
        else {
            // player's already in the database, modify record with new game
            Players.update({ _id: player._id }, { $set: { name: playerName, positionX: posX, positionY: posY, rotation: rotation, playerNumber: playerNumber } });
        }

        return player;
    }

    function PlayerConnect(match) {
        if (match.playerCount == 1) {
            // only have one player, throw up a message about waiting for the other

            waitingForPlayerText = game.add.text(gameWidth / 2, gameHeight / 2, 'Waiting for other player to join', { fontSize: '32px', fill: '#000' });
            waitingForPlayerText.anchor.setTo(0.5, 0.5);
        }
        else if (match.playerCount == 2) {
            // got two players, start game

            game.world.remove(waitingForPlayerText);

            //Meteor.publish("ReadyToPlay", function () { });

            SpawnPlayers();
        }
        else {
            console.log("Somehow we got too many players: " + match.playerCount.toString());
        }
    }

    function ActionOccured(matchId, actionItem) {

        console.log("Action occured: + " + ActionTypeEnum[actionItem.actionType] + ", match id: " + matchId);

        if (actionItem.actionType == ActionTypeEnum.PlayerConnect) {
            var match = Matches.find({ _id: matchId }).fetch()[0];
            PlayerConnect(match);
        }
        else if (actionItem.actionType == ActionTypeEnum.PlayerShoot) {
            if (actionItem.playerId != playerId) {
                otherPlayerTank.SetRotationDestination(actionItem.rotation);
                otherPlayerTank.SetShotVelocity(actionItem.velocity);
            }
        }
        else if (actionItem.actionType == ActionTypeEnum.GameOver) {
            if (actionItem.playerId != playerId) {
                if (!gameStarted) {
                    SetupPlayerDB(player.playerNumber == 1 ? 2 : 1, true);
                    window.setTimeout(Restart, 3000);
                }
                else {
                    otherPlayerDone = true;
                }
            }
        }
    }

    function Cleanup() {
        playerTank.active = false;
        otherPlayerTank.active = false;

        game.world.remove(playerTank);
        game.world.remove(otherPlayerTank);
        game.world.remove(playerTank.powerText);
        game.world.remove(playerTank.angleText);

        game.world.remove(scoreText);
        game.world.remove(windText);
        game.world.remove(waitingForPlayerText);
        game.world.remove(gameOverText);
    }

    function Restart() {

        Cleanup();
                        
        SpawnPlayers();

        gameStarted = true;
    }

    function Win() {
        gameOverText = game.add.text(gameWidth / 2, gameHeight / 2, 'YOU WIN', { fontSize: '32px', fill: '#000' });
        gameOverText.anchor.setTo(0.5, 0.5);
        gameStarted = false;

        IncreaseMyScore();

        if (otherPlayerDone) {
            SetupPlayerDB(player.playerNumber == 1 ? 2 : 1, true);
            window.setTimeout(Restart, 3000);
        }
    }

    function Lose() {
        gameOverText = game.add.text(gameWidth / 2, gameHeight / 2, 'YOU LOSE', { fontSize: '32px', fill: '#000' });
        gameOverText.anchor.setTo(0.5, 0.5);
        gameStarted = false;

        if (otherPlayerDone) {
            SetupPlayerDB(player.playerNumber == 1 ? 2 : 1, true);
            window.setTimeout(Restart, 3000);
        }
    }

    function Draw() {
        gameOverText = game.add.text(gameWidth / 2, gameHeight / 2, 'EVERYONE\'S A WINNER', { fontSize: '32px', fill: '#000' });
        gameOverText.anchor.setTo(0.5, 0.5);
        gameStarted = false;

        IncreaseMyScore();

        if (otherPlayerDone) {
            SetupPlayerDB(player.playerNumber == 1 ? 2 : 1, true);
            window.setTimeout(Restart, 3000);
        }
    }

    function IncreaseMyScore() {
        var match = Matches.find({ _id: matchId }).fetch()[0];

        for (i = 0; i < match.score.length; ++i) {
            if (match.score[i].playerId == playerId) {
                ++(match.score[i].score);
            }
        }

        Matches.update({ _id: matchId }, match);
    }

    function SetWaitingForPlayerText() {
        waitingForPlayerText = game.add.text(gameWidth / 2, gameHeight / 2, 'Waiting for other player to finish their game', { fontSize: '32px', fill: '#000' });
        waitingForPlayerText.anchor.setTo(0.5, 0.5);
    }

    function SpawnPlayers() {
        var match = Matches.find({ _id: matchId }).fetch()[0];
        
        var players = [];

        for (i = 0; i < match.playerIds.length; ++i) {
            var tempPlayer = Players.find({ _id: match.playerIds[i] }).fetch()[0];

            players.push(tempPlayer);
        }

        players.forEach(function (entry) {
            if (entry._id == playerId) {
                // this is our current player
                console.log("Current Player is " + entry.name);

                playerTank = AstroGliders.Tank(true, entry.positionX, entry.positionY, entry.rotation, game, matchId, playerId);
                playerTank.wind = match.wind;
            }
            else {
                // this is the other player being represented on the client
                console.log("Other player is " + entry.name);
                otherPlayerName = entry.name;
                otherPlayerTank = AstroGliders.Tank(false, entry.positionX, entry.positionY, entry.rotation, game, matchId, playerId);
                otherPlayerTank.wind = match.wind;
            }
        });

        var ourScore;
        var othersScore;

        for (i = 0; i < match.score.length; ++i) {
            if (match.score[i].playerId == playerId) {
                ourScore = match.score[i].score;
            }
            else {
                othersScore = match.score[i].score;
            }
        }

        totalScore = ourScore + othersScore;

        scoreText = game.add.text(gameWidth / 2, 16, playerName + ": " + ourScore + " | " + otherPlayerName + ": " + othersScore, { fontSize: '32px', fill: '#000' });
        scoreText.anchor.setTo(0.5, 0);

        windText = game.add.text(gameWidth - 16, 16, 'Wind: ' + Math.abs(match.wind) + (match.wind < 0 ? ' E' : ' W'), { fontSize: '32px', fill: '#000' });
        windText.anchor.setTo(1, 0);

        console.log("Game Started");
        gameStarted = true;
        otherPlayerDone = false;
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
        if (gameStarted) {
            playerTank.Update(otherPlayerTank, platforms);
            otherPlayerTank.Update(playerTank, platforms);

            if (playerTank.hasQueuedShot && otherPlayerTank.hasQueuedShot && otherPlayerTank.shouldRotate) {
                otherPlayerTank.StartRotating();
            }
            else if (playerTank.hasQueuedShot && otherPlayerTank.hasQueuedShot && !otherPlayerTank.isRotating) {
                playerTank.Shoot();
                otherPlayerTank.Shoot();
            }

            GoToGameOverOrNextTurn();

            //  Collide both players with the platforms
            game.physics.arcade.collide(playerTank, platforms);
            game.physics.arcade.collide(otherPlayerTank, platforms);
        }
    }

    function GoToGameOverOrNextTurn() {
        if (playerTank.shotCompleted && otherPlayerTank.shotCompleted) {
            // check if there is a winner
            if (playerTank.dead || otherPlayerTank.dead) {
                // tanks killed each other, it is a draw
                if (playerTank.dead && otherPlayerTank.dead) {
                    Draw()
                }
                else if (playerTank.dead) {
                    Lose();
                }
                else {
                    Win();
                }

                playerTank.shotCompleted = false;
                otherPlayerTank.shotCompleted = false;

                Actions.insert({ matchId: matchId, actionType: ActionTypeEnum.GameOver, playerId : playerId });
            }
                // no winner, go to the next shot
            else {
                playerTank.active = true;
            }
        }
    }

    /**
    * Public methods
    */
    return {
        /**
        * Create game.
        */
        createGame: function () {
            game = new Phaser.Game(gameWidth, gameHeight, Phaser.CANVAS, '',
            {
                preload: preload,
                create: create,
                update: update
            });
        }
    };
}