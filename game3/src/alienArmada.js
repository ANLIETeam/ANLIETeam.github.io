(function() {
    var maxScore = 0
    // Some stars
    var starCollections = ['', 2, 3].map(function (i) {
      return document.getElementById('stars' + i)
    })

    function setStarCollectionSpeed(i, speed) {
      starCollections[i].style.animation = 'animStar ' + speed + 's linear infinite'
    }
    // HTML elements
    var body = document.querySelector('body')

    var button = document.getElementsByTagName('button')[0]
    var ui = document.getElementById('ui')

    var scoreInfo = document.getElementById('message-score')
    var scoreHeader = document.querySelector('#message-score h2')
    var mainScore = document.querySelector('#message-score h3')

    var gameStateInfo = document.getElementById('message-game-state')
    var resultScore = document.querySelector('#message-game-state h3:first-child')
    var newBestMessage = document.querySelector('#message-game-state h3:last-child')
    // HTML event listeners
    button.addEventListener('click', function () {
      gameState = PLAYING
      button.style.display = 'none'
    })
    newBestMessage.style.display = 'none'
    //Холст и поверхность рисования
    var canvas = document.querySelector("canvas");
    var drawingSurface = canvas.getContext("2d");

    //Массивы загружаемых ресурсов
    var assetsToLoad = [];
    //Загрузка таблицы фреймов
    var image = new Image();
    image.addEventListener("load", loadHandler, false);
    image.src = "images/alienArmada.png";
    assetsToLoad.push(image);

    //Загрузка звуков
    var mainMenuMusic = document.querySelector("#mainMenuMusic");
    mainMenuMusic.addEventListener("canplaythrough", loadHandler, false);
    mainMenuMusic.load();
    assetsToLoad.push(mainMenuMusic);

    var gameMusic = document.querySelector("#gameMusic");
    gameMusic.addEventListener("canplaythrough", loadHandler, false);
    gameMusic.load();
    assetsToLoad.push(gameMusic);

    var shootSound = document.querySelector("#shootSound");
    shootSound.addEventListener("canplaythrough", loadHandler, false);
    shootSound.load();
    assetsToLoad.push(shootSound);

    var explosionSound = document.querySelector("#explosionSound");
    explosionSound.addEventListener("canplaythrough", loadHandler, false);
    explosionSound.load();
    assetsToLoad.push(explosionSound);
    //Счетчик числа загруженных ресурсов
    var assetsLoaded = 0;

    //Состояния игры
    var LOADING = 0;
    var PLAYING = 1;
    var OVER = 2;
    //Коды клавиш со стрелками
    var RIGHT = 39;
    var LEFT = 37;
    var SPACE = 32;
    // Button
    button.addEventListener('click', function () {
      // Transit to play state
      gameState = PLAYING
      setStarCollectionSpeed(0, 15)
      setStarCollectionSpeed(1, 5)
      setStarCollectionSpeed(2, 2)
      mainMenuMusic.pause()
      gameMusic.volume = 0.3
      gameMusic.play()
    })
    //Направления движения орудия
    var moveRight = false;
    var moveLeft = false;
    //Переменные для стрельбы ракетами
    var shoot = false;
    var spaceKeyIsDown = false;
    //Переменные игры
    var gameState = LOADING;
    var score = 0;
    var scoreNeededToWin = 60;
    var alienFrequency = 100;
    var alienTimer = 0;
    var sprites = [];
    var missiles = [];
    var aliens = [];
    var alienSpeed = 1.5;
    //Создание спрайта орудия внизу по центру холста
    var cannon = Object.create(spacecraft);
    cannon.sourceWidth = 110;
    cannon.sourceHeight = 174;
    sprites.push(cannon);
    //Подключение обработчиков событий нажатия/отпускания клавиш
    window.addEventListener("keydown", function(event) {
        switch (event.keyCode) {
            case LEFT:
                moveLeft = true;
                break;
            case RIGHT:
                moveRight = true;
                break;
            case SPACE:
                if (!spaceKeyIsDown) {
                    shoot = true;
                    spaceKeyIsDown = true;
                }
        }
    }, false);
    window.addEventListener("keyup", function(event) {
        switch (event.keyCode) {
            case LEFT:
                moveLeft = false;
                break;
            case RIGHT:
                moveRight = false;
                break;
            case SPACE:
                spaceKeyIsDown = false;
        }
    }, false);
    //Запуск цикла анимации игры

    update();

    function update() {
        //Цикл анимации
        requestAnimationFrame(update, canvas);
        //Выбор дальнейших действий в зависимости от состояния игры
        switch (gameState) {
            case LOADING:
                console.log("Загрузка...");
                break;
            case PLAYING:
                playGame();
                break;
            case OVER:
                endGame();
                break;
        }
        //Отображение игры
        render();
    }

    function loadHandler() {
        assetsLoaded++;
        if (assetsLoaded === assetsToLoad.length) {
            //Отключение отслеживания событий загрузки ресурсов
            image.removeEventListener("load", loadHandler, false);
            gameMusic.removeEventListener("canplaythrough",
                loadHandler, false);
            mainMenuMusic.removeEventListener("canplaythrough",
                loadHandler, false);
            shootSound.removeEventListener("canplaythrough",
                loadHandler, false);
            explosionSound.removeEventListener("canplaythrough",
                loadHandler, false);
            //Воспроизведение музыкального файла music
            mainMenuMusic.play();
            mainMenuMusic.volume = 0.8;
        }
        window.onresize = resizeCanvasAndPlaceCannon
        resizeCanvasAndPlaceCannon()
    }

    function playGame() {
        //Налево
        if (moveLeft && !moveRight) {
            cannon.vx = -10;
        }
        //Направо
        if (moveRight && !moveLeft) {
            cannon.vx = 10;
        }
        //Если ни одна из клавиш не нажата, скорость перемещения 0
        if (!moveLeft && !moveRight){
            cannon.vx = 0;
        }
        //Запуск ракеты, если shoot имеет значение true
        if (shoot) {
            fireMissile();
            shoot = false;
        }
        //Перемещение орудия в пределах границ холста
        cannon.x = Math.max(0, Math.min(cannon.x +
            cannon.vx, canvas.width - cannon.width));
        //Перемещение ракеты
        for (var i = 0; i < missiles.length; i++) {
            var missile = missiles[i];
            //Перемещение вверх по экрану
            missile.y += missile.vy;
            //Удаление ракеты при пересечении верхней границы холста
            if (missile.y < 0 - missile.height) {
                //Удаление ракеты из массива missiles
                removeObject(missile, missiles);
                //Удаление ракеты из массива sprites
                removeObject(missile, sprites);
                //Уменьшение переменной цикла на 1 для компенсации
                i--;
            }
        }
        //Создание пришельца
        //Увеличение на 1 таймера alienTimer
        alienTimer++;
        //Создание нового пришельца, если таймер равен alienFrequency
        if (alienTimer === alienFrequency) {
            makeAlien();
            alienTimer = 0;
            //Уменьшение alienFrequency на 1 для постепенного
            //увеличения частоты появления инопланетян
            if (alienFrequency > 2) {
              alienSpeed += 0.1
                alienFrequency --;
            }
        }
        //Цикл по пришельцам
        for (var i = 0; i < aliens.length; i++) {
            var alien = aliens[i];
            if (alien.state === alien.NORMAL) {
                //Перемещение пришельца, если его состояние NORMAL
                alien.y += alien.vy;
            }
            //Проверка столкнулись ли корабли
            var crashed = hitTestRectangle(alien, cannon)
            if (crashed) {
                //Завершение игры, если корабли столкнулись
                gameState = OVER;
            }
        }
        //--- Столкновение объектов
        //Проверка столкновения пришельцев и ракет
        for (var i = 0; i < aliens.length; i++) {
            var alien = aliens[i];
            for (var j = 0; j < missiles.length; j++) {
                var missile = missiles[j];
                if (hitTestRectangle(missile, alien) &&
                    alien.state === alien.NORMAL) {
                    //Увеличение счета
                    score++;
                    //Удаление ракеты
                    removeObject(missile, missiles);
                    removeObject(missile, sprites);
                    //Уменьшение счетчика цикла на 1 для компенсации
                    j--;
                    //Удаление пришельца
                    destroySpacecraft(alien);
                }
            }
        }
        //Отображение счета
        mainScore.innerHTML = score;
        scoreHeader.innerHTML = "SCORE"
        //Проверка завершения игры победой игрока
        if (score === scoreNeededToWin) {
            gameState = OVER;
        }
    }

    function destroySpacecraft(alien, callback) {
        console.log(alien);
        //Смена состояния пришельца
        alien.state = alien.EXPLODED;
        alien.explode();
        //Удаление спрайта пришельца через 1,1 секунду
        setTimeout(function () {
          removeAlien(alien)
          callback()
        }, 1200);
        //Воспроизведение звука взрыва
        explosionSound.currentTime = 0;
        explosionSound.volume = 0.2
        explosionSound.play();

        function removeAlien() {
            removeObject(alien, aliens);
            removeObject(alien, sprites);
        }
    }

    function makeAlien() {
        //Создание спрайта пришельца
        var alien = Object.create(spacecraft);
        alien.sourceX = 110;
        alien.sourceWidth = 119;
        alien.sourceHeight = 126;
        //Установка Y-поциции пришельца за верхней границей холста
        alien.y = 0 - alien.height;
        //Установка случайной X-поциции пришельца
        var randomPosition = Math.floor(Math.random() * 15);
        alien.x = randomPosition * alien.width;
        //Установка скорости перемещения пришельца
        alien.vy = alienSpeed;
        //Добавление спрайта в массивы sprites и aliens
        sprites.push(alien);
        aliens.push(alien);
    }

    function fireMissile() {
        //Создание спрайта ракеты
        var missile = Object.create(spriteObject);
        missile.sourceX = 94;
        missile.sourceY = 231;
        missile.sourceWidth = 13;
        missile.sourceHeight = 19;
        missile.width = 13;
        missile.height = 19;
        //Позиционирование ракеты над орудием
        missile.x = cannon.centerX() - missile.halfWidth();
        missile.y = cannon.y - missile.height;
        //Установка скорости перемещения ракеты
        missile.vy = -8;
        //Добавление спрайта ракеты в массивы sprites и missiles
        sprites.push(missile);
        missiles.push(missile);
        //Воспроизведение звука пуска ракеты
        shootSound.currentTime = 0;
        shootSound.play();
    }

    function removeObject(objectToRemove, array) {
        var i = array.indexOf(objectToRemove);
        if (i !== -1) {
            array.splice(i, 1);
        }
    }

    function endGame() {
        destroySpacecraft(cannon, function () {
          //Направления движения орудия
          moveRight = false;
          moveLeft = false;
          //Переменные для стрельбы ракетами
          shoot = false;
          spaceKeyIsDown = false;
          //Переменные игры
          gameState = LOADING;
          score = 0;
          scoreNeededToWin = 60;
          alienFrequency = 100;
          alienTimer = 0;
          sprites = [];
          missiles = [];
          aliens = [];
          cannon = Object.create(spacecraft);
          cannon.sourceWidth = 110;
          cannon.sourceHeight = 174;
          sprites.push(cannon);
          resizeCanvasAndPlaceCannon()
          console.log(cannon);
        })

        gameMusic.pause()
        mainMenuMusic.play()

        setStarCollectionSpeed(0, 50)
        setStarCollectionSpeed(1, 25)
        setStarCollectionSpeed(2, 10)

        gameState = LOADING
        scoreInfo.style.display = 'none'
        gameStateInfo.style.display = 'block'
        resultScore.innerHTML = "SCORE: " + score

        if (score > maxScore){
          newBestMessage.style.display = 'block'
          maxScore = score
        }

        body.addEventListener('click', showMainMenu)
    }

    function render() {
        drawingSurface.clearRect(0, 0, canvas.width, canvas.height);
        //Отображение спрайтов
        if (sprites.length !== 0) {
            for (var i = 0; i < sprites.length; i++) {
                var sprite = sprites[i];
                drawingSurface.drawImage(image,
                    sprite.sourceX, sprite.sourceY,
                    sprite.sourceWidth, sprite.sourceHeight,
                    Math.floor(sprite.x), Math.floor(sprite.y),
                    sprite.width, sprite.height);
            }
        }
    }

    function resizeCanvasAndPlaceCannon() {
      console.log('Resize');
      mainScore.innerHTML = maxScore
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      cannon.y = window.innerHeight - 100;
      cannon.x = canvas.width / 2 - cannon.width / 2;
    }

    function showMainMenu() {
      body.removeEventListener('click', showMainMenu)
      gameStateInfo.style.display = 'none'
      newBestMessage.style.display = 'none'
      scoreInfo.style.display = 'block'
      scoreHeader.innerHTML = 'BEST'
      button.style.display = 'block'
    }
}());
