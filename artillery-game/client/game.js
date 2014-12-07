game = function ()
{
    var game;
    var player;
    var platforms;
    var cursors;

    var stars;
    var score = 0;
    var scoreText;

    var gameWidth = 1280;
    var gameHeight = 720;

    function preload()
    {
        game.load.image('ground', '/assets/platform.png');
        game.load.image('sky', '/assets/sky.png');
        game.load.image('star', '/assets/star.png');
        game.load.spritesheet('dude', '/assets/dude.png', 32, 48);
    }

    function create()
    {
        game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;

        SetupWorld();

        SetupPlayer();

        SetupStars();

        //  The score
        scoreText = game.add.text(16, 16, 'score: 0', { fontSize: '32px', fill: '#000' });

        //  Our controls.
        cursors = game.input.keyboard.createCursorKeys();
    }

    function SetupWorld()
    {
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

    function SetupPlayer()
    {
        // The player and its settings
        player = game.add.sprite(32, game.world.height - 150, 'dude');

        //  We need to enable physics on the player
        game.physics.arcade.enable(player);

        //  Player physics properties. Give the little guy a slight bounce.
        player.body.bounce.y = 0.2;
        player.body.gravity.y = 300;
        player.body.collideWorldBounds = true;

        //  Our two animations, walking left and right.
        player.animations.add('left', [0, 1, 2, 3], 10, true);
        player.animations.add('right', [5, 6, 7, 8], 10, true);
    }

    function SetupStars()
    {
        //  Finally some stars to collect
        stars = game.add.group();

        //  We will enable physics for any star that is created in this group
        stars.enableBody = true;

        //  Here we'll create 12 of them evenly spaced apart
        for (var i = 0; i < 17; i++) {
            //  Create a star inside of the 'stars' group
            var star = stars.create((i + 1) * 70, 0, 'star');

            //  Let gravity do its thing
            star.body.gravity.y = 1000;

            //  This just gives each star a slightly random bounce value
            star.body.bounce.y = 0.7 + Math.random() * 0.2;
        }
    }

    function update() {

        //  Collide the player and the stars with the platforms
        game.physics.arcade.collide(player, platforms);
        game.physics.arcade.collide(stars, platforms);

        //  Checks to see if the player overlaps with any of the stars, if he does call the collectStar function
        game.physics.arcade.overlap(player, stars, collectStar, null, this);

        //  Reset the players velocity (movement)
        player.body.velocity.x = 0;
                
        if (game.input.pointer1.isDown)
        {
            // just testing out some basic touch input here
            TouchInput();
        }
        else if (cursors.left.isDown)
        {
            //  Move to the left
            player.body.velocity.x = -150;

            player.animations.play('left');
        }
        else if (cursors.right.isDown)
        {
            //  Move to the right
            player.body.velocity.x = 150;

            player.animations.play('right');
        }
        else
        {
            //  Stand still
            player.animations.stop();

            player.frame = 4;
        }

        //  Allow the player to jump if they are touching the ground.
        if (cursors.up.isDown && player.body.touching.down)
        {
            player.body.velocity.y = -350;
        }
    }

    function TouchInput()
    {
        if (Math.floor(game.input.x / (game.width / 2)) === 1) {
            //  Move to the left
            player.body.velocity.x = 150;

            player.animations.play('right');
        }

        if (Math.floor(game.input.x / (game.width / 2)) === 0) {
            //  Move to the right
            player.body.velocity.x = -150;

            player.animations.play('left');
        }
    }

    function collectStar (player, star)
    {
        // Removes the star from the screen
        star.kill();

        //  Add and update the score
        score += 10;
        scoreText.text = 'Score: ' + score;

        if (Stars) {
            Stars.insert({ player: 'Stu', score: score });
        }
    }

    /**
    * Public methods
    */
    return {
    /**
    * Create game.
    */
        createGame: function()
        {
            game = new Phaser.Game(gameWidth, gameHeight, Phaser.AUTO, '',
            {
                preload: preload,
                create: create,
                update: update
            });
        }
    };
}