(function() {
    //Холст и поверхность рисования
    var canvas = document.querySelector("canvas");
    var drawingSurface = canvas.getContext("2d");

    //Массивы игровых объектов и загружаемых ресурсов
    var sprites = [];
    var assetsToLoad = [];
    var missiles = [];
    var aliens = [];
    var messages = [];
    var starBackgrounds = [];

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

    //Направления движения орудия
    var moveRight = false;
    var moveLeft = false;
    //Переменные для стрельбы ракетами
    var shoot = false;
    var spaceKeyIsDown = false;
    //Переменные игры
    var gameState = LOADING;
    var score = 0;
    var scoreNeededToWin = 30;
    var alienFrequency = 100;
    var alienTimer = 0;
    var alienSpeed = 1.5;
    var cannonSpeed = 10;

    //Создание спрайтов звезд
    var sourceY = 253;
    var factor = 4;
    for (i = 0; i < 3; i++){
      var starBackground = Object.create(spriteObject);
      starBackground.sourceWidth = canvas.width * (1 + 1 / factor);
      starBackground.sourceHeight = 700;
      starBackground.width = starBackground.sourceWidth;
      starBackground.height = canvas.height;
      starBackground.sourceY = sourceY;
      starBackground.x = (canvas.width - starBackground.width) / 2;
      starBackground.y = 0;
      starBackground.maxVX = cannonSpeed / factor;
      sprites.push(starBackground);
      starBackgrounds.push(starBackground);

      // Increment
      sourceY += 700;
      factor *= 2;
    }
    //Создание спрайта Земли
    var planet = Object.create(spriteObject);
    planet.sourceWidth = planet.width = 466;
    planet.sourceHeight = planet.height = 100;
    planet.sourceX = 0;
    planet.sourceY = 2352;
    planet.x = (canvas.width - planet.width) / 2;
    planet.y = 600;
    planet.maxVX = cannonSpeed / 6;
    sprites.push(planet)
    //Создание спрайта орудия внизу по центру холста
    var cannon = Object.create(spacecraft);
    cannon.sourceWidth = 110;
    cannon.sourceHeight = 174;
    cannon.x = (canvas.width - cannon.width) / 2;
    cannon.y = canvas.height - cannon.height - 5;
    sprites.push(cannon);
    //Создание объекта для отображения счета игры
    var scoreDisplay = Object.create(messageObject);
    scoreDisplay.font = "normal bold 30px emulogic";
    scoreDisplay.fillStyle = "#00FF00";
    scoreDisplay.x = 330;
    scoreDisplay.y = 10;
    messages.push(scoreDisplay);
    //Создание объекта для отображения сообщения о конце игры
    var gameOverMessage = Object.create(messageObject);
    gameOverMessage.font = "normal bold 20px emulogic";
    gameOverMessage.fillStyle = "#00FF00";
    gameOverMessage.x = 55;
    gameOverMessage.y = 120;
    gameOverMessage.visible = false;
    messages.push(gameOverMessage);

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

    //Подключение обработчиков событий касания
    var touch = null
    canvas.addEventListener("touchstart", function(event){
      //Update ongoing touches
      touch = event.touches[0]

      var touchX = touch.pageX - canvas.offsetLeft + canvas.width / 2
      var touchY = touch.pageY - canvas.offsetTop + canvas.height / 2
      if (touchX > cannon.x + cannon.width / 2){
        moveRight = true;
      } else {
        moveRight = false
        if (touchX < cannon.x){
          moveLeft = true;
        } else {
          moveLeft = false
          if (touchY >= cannon.y){
            if (!spaceKeyIsDown) {
                shoot = true;
                spaceKeyIsDown = true;
            }
          }
        }
      }
    }, false);
    canvas.addEventListener("touchend", function(event){
      touch = null

      if (moveRight){
        moveRight = false
      } else if (moveLeft) {
        moveLeft = false
      } else if (spaceKeyIsDown){
        spaceKeyIsDown = false
      }
    }, false);

    //Запуск цикла анимации игры
    update();

    function update() {
        //Цикл анимации
        requestAnimationFrame(update, canvas);
        //Прекратить движение
        if (touch){
          var touchX = touch.pageX - canvas.offsetLeft + canvas.width / 2
          if (moveRight && touchX <= cannon.x + cannon.width / 2) {
            moveRight = false
          } else if (moveLeft && touchX >= cannon.x) {
            moveLeft = false
          }
        }
        //Выбор дальнейших действий в зависимости от состояния игры
        switch (gameState) {
            case LOADING:
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
            //Start game
            gameState = PLAYING;
        }
    }

    function playGame() {
        var dbg = false;
        //Налево
        if (moveLeft && !moveRight) {
            cannon.vx = -cannonSpeed;
            for (i = 0; i < starBackgrounds.length; i++){
              starBackgrounds[i].vx = -starBackgrounds[i].maxVX
            }
            planet.vx = -planet.maxVX
        }
        //Направо
        if (moveRight && !moveLeft) {
            cannon.vx = cannonSpeed;
            for (i = 0; i < starBackgrounds.length; i++){
              starBackgrounds[i].vx = starBackgrounds[i].maxVX
            }
            planet.vx = planet.maxVX
        }
        //Если ни одна из клавиш не нажата, скорость перемещения 0
        if (!moveLeft && !moveRight){
            cannon.vx = 0;
            for (i = 0; i < starBackgrounds.length; i++){
              starBackgrounds[i].vx = 0
            }
            planet.vx = 0
        }
        //Запуск ракеты, если shoot имеет значение true
        if (shoot) {
            fireMissile();
            shoot = false;
        }
        //Перемещение орудия в пределах границ холста
        cannon.x = Math.max(0, Math.min(cannon.x +
            cannon.vx, canvas.width - cannon.width));
        //Перемещение звезд
        for (i = 0; i < starBackgrounds.length; i++){
          starBackgrounds[i].x = Math.max(canvas.width - starBackgrounds[i].width,
            Math.min(starBackgrounds[i].x + starBackgrounds[i].vx, 0));
        }
        //Перемещение планеты
        planet.x = Math.max(canvas.width - planet.width,
          Math.min(planet.x + planet.vx, 0))
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
              alienFrequency--;
            }
        }
        //Цикл по пришельцам
        for (var i = 0; i < aliens.length; i++) {
            var alien = aliens[i];
            if (alien.state === alien.NORMAL) {
                //Перемещение пришельца, если его состояние NORMAL
                alien.y += alien.vy;
            }
            //Проверка, пересек ли пришелец нижний край холста
            if(alien.y > canvas.height)
            // if(true)
            {
              //Завершение игры, если пришелец достиг Земли
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
        scoreDisplay.text = score;
        //Проверка завершения игры победой игрока
        if(score === scoreNeededToWin)
        {
          gameState = OVER;
        }
    }

    function destroySpacecraft(alien) {
        //Смена состояния пришельца
        alien.state = alien.EXPLODED;
        alien.explode();
        //Удаление спрайта пришельца через 1,1 секунду
        setTimeout(function () {
          removeAlien(alien)
        }, 1100);
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
        var randomPosition = Math.floor(Math.random() * (canvas.width - alien.width));
        alien.x = randomPosition
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
    function endGame()
      {
        gameOverMessage.visible = true;
        if(score < scoreNeededToWin){
          gameOverMessage.text = "Earth captured!";
        }
        else {
          gameOverMessage.x = 80;
          gameOverMessage.text = "Earth saved!";
        }
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
        //Отображение игровых сообщений
      if(messages.length !== 0){
        for(var i = 0; i < messages.length; i++){
          var message = messages[i];
          if(message.visible){
            drawingSurface.font = message.font;
            drawingSurface.fillStyle = message.fillStyle;
            drawingSurface.textBaseline = message.textBaseline;
            drawingSurface.fillText(message.text, message.x,
              message.y);
          }
        }
      }
    }
}());
