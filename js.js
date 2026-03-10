const grid = document.getElementById("grid");

// Размеры поля
const rows = 13;
const cols = 15;

const walls = [];

let currentLevel = 1; // Текущий уровень
let enemiesOnLevel = 1; // Кол-во врагов на текущем уровне
let bombCount = 1; // Количество бомб
let explosionRadius = 1; // Радиус взрыва
let score = 0;

// Иконки бонусов
const bonusIcons = {
  bomb: "img/extrabomb.png", // Иконка для бонуса бомб
  power: "img/extraradius.png", // Иконка для бонуса радиуса взрыва
  heal: "img/extrahp.png" // Иконка для бонуса хп
};

// Переменные для уровня
let doorCell = null; // Клетка с дверью
let doorFound = false; // Флаг для проверки, найдена ли дверь

// Создание игрового поля

function generateGrid() {
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const cell = document.createElement("div");
      cell.classList.add("ground");
      cell.dataset.x = x;
      cell.dataset.y = y;
      grid.appendChild(cell);

      // Несгораемые по краям и в шахматном порядке
      if (
        x === 0 || y === 0 || x === cols - 1 || y === rows - 1 ||
        (x % 2 === 0 && y % 2 === 0)
      ) {
        cell.classList.add("unbreakable-block");
        walls.push(`${x},${y}`);
      } else {
        // Пропуск в зоне очистки
        const inClearZone = (
          (x >= 1 && x <= 3 && y === 1) ||
          (y >= 1 && y <= 3 && x === 1)
        );

        // Разрушаемые спавинтся с шансом 25% в рандомной клетке
        if (!inClearZone && Math.random() < 0.25) {
          cell.classList.add("breakable-block");
        }
      }
    }
  }

  // Ставим по блоку от старта
  getCell(3, 1).classList.add("breakable-block");
  getCell(1, 3).classList.add("breakable-block");
}

generateGrid();

// Получение ячейки по координатам
function getCell(x, y) {
  return document.querySelector(`.ground[data-x="${x}"][data-y="${y}"]`);
}

// Спавним персонажа на [1,1]
const player = document.createElement("div");
player.classList.add("player");
getCell(1, 1).appendChild(player);

// Функция для создания врагов
function spawnEnemiesForCurrentLevel() {
  // Увеличиваем количество врагов в зависимости от уровня
  switch (currentLevel) {
    case 1:
      console.log(currentLevel);
      spawnEnemySafe(false);
      break;
    case 2:
      console.log(currentLevel);
      for (let i = 0; i < 4; i++) {
        spawnEnemySafe(false);
      }
      break;
    case 3:
      console.log(currentLevel);
      enemiesOnLevel = 5;
      for (let i = 0; i < 3; i++) {
        spawnEnemySafe(false);  // Спавним обычного врага
      }
      for (let i = 0; i < 2; i++) {
        spawnEnemySafe(true);  // Спавним взрывного врага
      }
      break;
    default:
      // Для других уровней количество врагов будет случайным
      enemiesToSpawn = Math.floor(Math.random() * 5) + 5; // Случайное количество от 4 до 9 врагов
      for (let i = 0; i < enemiesToSpawn; i++) {
        const isExplosive = Math.random() < 0.5; // 50% шанс для взрывного врага
        spawnEnemySafe(isExplosive);
      }
      break;
  }
}

// Получение всех свободных ячеек
function getFreeCells() {
  const cells = document.querySelectorAll('.ground');
  return Array.from(cells).filter(cell => {
    const x = parseInt(cell.dataset.x);
    const y = parseInt(cell.dataset.y);

    const inClearZone = (
      (x >= 1 && x <= 3 && y === 1) ||
      (x === 1 && y >= 1 && y <= 3)
    );

    return (
      !inClearZone &&
      !cell.classList.contains("unbreakable-block") &&
      !cell.classList.contains("breakable-block") &&
      !cell.querySelector(".player") &&
      !cell.querySelector(".enemy")
    );
  });
}

// Возвращает случайную свободную клетку
function getFreeCell() {
  const freeCells = getFreeCells();
  if (freeCells.length === 0) return null;
  return freeCells[Math.floor(Math.random() * freeCells.length)];
}

// Спавним врага в случайной клетке
function spawnEnemySafe(isExplosive) {
  const cell = getFreeCell();
  if (!cell) return;
  const enemy = document.createElement("div");
  enemy.classList.add("enemy");
  
  if (isExplosive) {
    enemy.classList.add("explosive");
    enemy.dataset.explosive = true;
  } 

  cell.appendChild(enemy);
}

// Функция для перемещения врага в случайном направлении
function moveEnemy(enemy) {
  console.log("moveEnemy");
  const currentCell = enemy.parentElement;
  const x = parseInt(currentCell.dataset.x);
  const y = parseInt(currentCell.dataset.y);

  const directions = [
    { x: 0, y: -1 }, // вверх
    { x: 0, y: 1 },  // вниз
    { x: -1, y: 0 }, // влево
    { x: 1, y: 0 }   // вправо
  ];

  const freeDirections = [];

  // Проверяем каждую из 4-х клеток вокруг врага
  directions.forEach(direction => {
    const newX = x + direction.x;
    const newY = y + direction.y;
    const nextCell = getCell(newX, newY);

    // Если клетка существует и свободна, добавляем ее в список свободных клеток
    if (nextCell && 
        !nextCell.querySelector(".bomb") && // Если нет бомбы
        !nextCell.classList.contains("unbreakable-block") && // Если нет несгораемого блока
        !nextCell.classList.contains("breakable-block") && // Если нет разрушимого блока
        !nextCell.classList.contains("enemy") // Если нет врага
    ) {
      freeDirections.push(nextCell);
    }
  });

  // Если есть свободные клетки, выбираем одну случайную
  if (freeDirections.length > 0) {
    const randomCell = freeDirections[Math.floor(Math.random() * freeDirections.length)];
    randomCell.append(enemy);

    // Проверка на столкновение с игроком
    if (randomCell.querySelector(".player")) {
      checkForCollisions();
    }
  }
}


// Даем каждому врагу движение
function moveEnemies() {
  const enemies = document.querySelectorAll(".enemy");
  enemies.forEach(enemy => {
    moveEnemy(enemy); // Перемещение врагов
  })
}

// // // Спавним 3 врагов
// spawnEnemySafe();
// spawnEnemySafe();
// spawnEnemySafe();
// spawnEnemySafe();

// Переменные для HP и жизней
let playerLives = 3;

// Получаем элементы для отображения жизней
const playerLivesDisplay = document.getElementById("lives");

// Изначальные значения
playerLivesDisplay.textContent = playerLives;

// Функция для отправки игрока на точку спавна
function resetPlayerPosition() {
  const spawnCell = getCell(1, 1);
  spawnCell.appendChild(player);
}

// Столкновение игрока с врагом
function handlePlayerEnemyCollision() {
  playerLives -= 1;
  
  if (playerLives <= 0) {
    alert("Game Over, you die!");
    location.reload();
    return;
  }


  resetPlayerPosition();
  playerLivesDisplay.textContent = playerLives;
}

// Функция для проверки столкновений игрока с врагами
function checkForCollisions() {
  const enemies = document.querySelectorAll(".enemy");
  enemies.forEach(enemy => {
    const enemyCell = enemy.parentElement;
    const playerCell = player.parentElement;

    // Проверка столкновения с врагами
    if (enemyCell === playerCell) {
      handlePlayerEnemyCollision();
    }
  });

  // Проверка столкновения игрока с бомбой
  const playerCell = player.parentElement;
  if (playerCell.querySelector(".bomb")) {
    handlePlayerDeath();
  }
}

setInterval(moveEnemies, 1000); // Враги продолжают двигаться каждую секунду

// // Проверка можно и поставить бомбу
let canPlaceBomb = true;
let isKeyPressed = false;

// Хоткеи
document.addEventListener("keydown", e => {
  if (e.key === "0") {
    timeLeft = 0;
    updateTimerDisplay();
    clearInterval(timerInterval);
    gameOver = true;
    alert("Time is over!");
    location.reload();
    return;
  }

  if (gameOver || isKeyPressed) return;

  isKeyPressed = true;

  const current = player.parentElement;
  const x = parseInt(current.dataset.x);
  const y = parseInt(current.dataset.y);

  let newX = x;
  let newY = y;

  if (e.key === "ArrowUp") newY--;
  if (e.key === "ArrowDown") newY++;
  if (e.key === "ArrowLeft") newX--;
  if (e.key === "ArrowRight") newX++;

  const next = getCell(newX, newY);

  // Проверка на наличие бомбы в следующей клетке
  if (next && !next.querySelector(".bomb") && // Если в клетке нет бомбы
      !next.classList.contains("unbreakable-block") &&
      !next.classList.contains("breakable-block")
  ) {
    next.appendChild(player);
    if (next.querySelector(".enemy")) {
      checkForCollisions();
    }
  }
  
  if (e.code === "Space" && canPlaceMoreBombs()) {
    placeBomb(x, y);
  }

  // Добавляем проверку для подбора бонуса (клавиша E)
  if (e.key === "e" || e.key === "E") {
    collectBonus(x, y);
  }

  // Добавляем проверку для подбора бонуса (клавиша У)
  if (e.key === "у" || e.key === "У") {
    collectBonus(x, y);
  }
});

document.addEventListener("keyup", () => {
  isKeyPressed = false;  // Сбрасываем флаг при отпускании клавиши
});

// Функция для проверки, можно ли поставить еще одну бомбу
function canPlaceMoreBombs() {
  const placedBombs = document.querySelectorAll('.bomb');
  return placedBombs.length < bombCount;  // Если установлено меньше бомб, чем bombCount
}

// Функция для установки бомбы
function placeBomb(x, y, isEnemy = false) {
  // canPlaceBomb = false;
  const cell = getCell(x, y);
  if (cell.querySelector('.bomb')) {
    return;  // Если бомба уже есть в клетке, ничего не делаем
  }
  if ((!canPlaceMoreBombs() && isEnemy == false) || gameOver) return;


  const bomb = document.createElement("div");
  bomb.classList.add("bomb");
  console.log("bomb")
  cell.appendChild(bomb);

  if (isEnemy) {
    setTimeout(() => {
      explode(x, y, 1);
      bomb.remove();
    }, 2000);
  } else {
    setTimeout(() => {
      explode(x, y);
      bomb.remove();
    }, 2000);   
  }
}

// Функция для размещения двери в случайном разрушимом блоке
function placeDoor() {
  const breakableCells = document.querySelectorAll('.breakable-block')
  if (breakableCells.length > 0) {
    const randomCell = breakableCells[Math.floor(Math.random() * breakableCells.length)];
    doorCell = randomCell;
  }
}

// Вставляем дверь в игру
placeDoor();


// Функция для обработки взрыва бомбы
function explode(x, y, radius=explosionRadius) {
  const cells = [
    getCell(x, y)
  ];
    
  // Флаги для контроля, чтобы останавливать взрыв по направлениям
  let rightCellContainsBlock = false;
  let leftCellContainsBlock = false;
  let upCellContainsBlock = false;
  let downCellContainsBlock = false;

  // Проходим по всем направлениям с увеличением радиуса
  for (let i = 1; i <= radius; i++) {
    // Для правой стороны (вправо)
    const rightCell = getCell(x + i, y);
    if (rightCell) {
      if (rightCell.classList.contains("unbreakable-block") || rightCellContainsBlock) {
        rightCellContainsBlock = true; // Останавливаем добавление клеток вправо, если встретился несгораемый блок
      } else if (rightCell.classList.contains("breakable-block")) {
        cells.push(rightCell);  // Разрушаем первый блок
        rightCellContainsBlock = true;  // Останавливаем взрыв в этом направлении после разрушения блока
      } else {
        cells.push(rightCell);  // Если клетка пустая или не блок, продолжаем
      }
    }

    // Для левой стороны (влево)
    const leftCell = getCell(x - i, y);
    if (leftCell) {
      if (leftCell.classList.contains("unbreakable-block") || leftCellContainsBlock) {
        leftCellContainsBlock = true;  // Останавливаем добавление клеток влево
      } else if (leftCell.classList.contains("breakable-block")) {
        cells.push(leftCell);  // Разрушаем первый блок
        leftCellContainsBlock = true;  // Останавливаем взрыв в этом направлении
      } else {
        cells.push(leftCell);  // Если клетка пустая или не блок, продолжаем
      }
    }

    // Для нижней стороны (вниз)
    const downCell = getCell(x, y + i);
    if (downCell) {
      if (downCell.classList.contains("unbreakable-block") || downCellContainsBlock) {
        downCellContainsBlock = true;  // Останавливаем добавление клеток вниз
      } else if (downCell.classList.contains("breakable-block")) {
        cells.push(downCell);  // Разрушаем первый блок
        downCellContainsBlock = true;  // Останавливаем взрыв в этом направлении
      } else {
        cells.push(downCell);  // Если клетка пустая или не блок, продолжаем
      }
    }

    // Для верхней стороны (вверх)
    const upCell = getCell(x, y - i);
    if (upCell) {
      if (upCell.classList.contains("unbreakable-block") || upCellContainsBlock) {
        upCellContainsBlock = true;  // Останавливаем добавление клеток вверх
      } else if (upCell.classList.contains("breakable-block")) {
        cells.push(upCell);  // Разрушаем первый блок
        upCellContainsBlock = true;  // Останавливаем взрыв в этом направлении
      } else {
        cells.push(upCell);  // Если клетка пустая или не блок, продолжаем
      }
    }
  }

  // Перебираем все клетки в радиусе взрыва
  cells.forEach(cell => {
    if (!cell) return;
    if (cell.classList.contains("unbreakable-block")) return;

    const enemy = cell.querySelector(".enemy");
    if (enemy) handleEnemyDeath(enemy);

    if (cell.querySelector(".player")) {
      handlePlayerDeath();
    }

    if (cell.classList.contains("door") && doorFound) {
        const enemy = document.createElement("div");
        enemy.classList.add("enemy");
        cell.appendChild(enemy);
        console.log("Враги вышли из двери!");
    }

    if (cell.classList.contains("breakable-block")) {
      cell.classList.remove("breakable-block");

      // С шансом 10% даем бонус при разрушении блока
      if (Math.random() < 0.1 && cell != doorCell) {
        const bonusType = Math.floor(Math.random() * 3); // Теперь 3 бонуса (бомбы, радиус и хилка)
          
        // Добавление бонусов с иконками
        const bonusIcon = document.createElement("img");
        bonusIcon.classList.add("bonus-icon"); // Для правильного позиционирования иконок
        console.log('Bonus type: ', bonusType, ' Icon source: ', bonusIcon.src);

        switch (bonusType) {
          case 0:
            bonusIcon.src = bonusIcons.bomb; // Иконка бонуса бомб
            break;
          case 1:
            bonusIcon.src = bonusIcons.power; // Иконка бонуса радиуса
            break;
          case 2:
            bonusIcon.src = bonusIcons.heal; // Иконка бонуса хилка
            break;
        }

        // Добавляем иконку бонуса на поле
        cell.appendChild(bonusIcon);
      }

      if (cell === doorCell && !doorFound) {
        doorCell.classList.add("door");
        doorFound = true;
      }
    }

    const explosion = document.createElement("div");
    explosion.classList.add("explosion");
    cell.appendChild(explosion);

    setTimeout(() => {
      explosion.remove();
    }, 500);
  });
}


// Функция для подбора бонуса
function collectBonus(x, y) {
  const cell = getCell(x, y); // Получаем клетку по координатам
  const bonusIcon = cell.querySelector("img.bonus-icon"); // Ищем бонус в ячейке

  if (bonusIcon) { // Если бонус найден
    bonusIcon.remove(); // Убираем бонус с карты

    // Активируем эффект бонуса
    if (bonusIcon.src.includes(bonusIcons.bomb)) { // Если бонус — увеличение количества бомб
      bombCount++;
      document.getElementById("bomb-count").textContent = bombCount;
      activateSecondBomb();
    } else if (bonusIcon.src.includes(bonusIcons.power)) { // Если бонус — увеличение радиуса взрыва
      explosionRadius++;
      document.getElementById("power-count").textContent = explosionRadius;
      activateRadiusUpgrade(); 
    } else if (bonusIcon.src.includes(bonusIcons.heal)) { // Если бонус — хилка
      // Проверяем, что у игрока меньше 3-х жизней
      if (playerLives < 3) {
        playerLives += 1; // Восстанавливаем здоровье
        document.getElementById("lives").textContent = playerLives; // Обновляем количество жизней
        activateHealthUpgrade(); // Активируем бонус в интерфейсе
        console.log("Хилка активирована! +1 к здоровью.");
      } else {
        console.log("Хилка не активирована, у вас уже 3 жизни.");
      }
    }
  }
}

let gameOver = false;

let timeLeft = 180;

const timerElement = document.getElementById("timer");

function updateTimerDisplay() {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

const timerInterval = setInterval(() => {
  if (timeLeft <= 0) {
    clearInterval(timerInterval);
    gameOver = true;
    timerElement.textContent = "0:00";
    alert("Time is over! You lose.");
    location.reload();
    return;
  }

  timeLeft--;
  updateTimerDisplay();
}, 1000);

updateTimerDisplay();

function handlePlayerDeath() {
  playerLives -= 1;
  
  if (playerLives <= 0) {
    alert("Game Over! You died.");
    location.reload();
    return;
  }

  resetPlayerPosition();
  playerLivesDisplay.textContent = playerLives;
}

function handlePlayerEnemyCollision() {
  handlePlayerDeath();
}


function handleEnemyDeath(enemy) {
  console.log("handleEnemyDeath")
  // Если это взрывной враг, он оставляет бомбу
  if (enemy.dataset.explosive) {
    console.log("explosive");
    const x = parseInt(enemy.parentElement.dataset.x);
    const y = parseInt(enemy.parentElement.dataset.y);

    // Устанавливаем бомбу в клетке, где был враг
    placeBomb(x, y, true);

    score += 2000;
  } else {
    score += 1000;
  }

  updateScore();

  // Удаляем врага
  enemy.remove();
}


let bombUpgradeActive = false;
let radiusUpgradeActive = false;
let healthUpgradeActive = false;

function activateSecondBomb() {
  bombUpgradeActive = true;
  document.getElementById("secondBomb").classList.remove("inactive");
  console.log("Вторая бомба активирована!");
}

function activateRadiusUpgrade() {
  radiusUpgradeActive = true;
  document.getElementById("radiusUpgrade").classList.remove("inactive");
  console.log("Увеличение радиуса бомбы активировано!");
}

function activateHealthUpgrade() {
  healthUpgradeActive = true;
  document.getElementById("healthUpgrade").classList.remove("inactive");
  console.log("Хилка активирована! +1 к здоровью.");
}

function nextLevel() {
  const timeBonus = Math.floor(timeLeft / 10) * 100;  // 100 очков за каждые 10 секунд
  score += timeBonus;  // Добавляем бонус к текущему счету
  updateScore();  // Обновляем отображение счета


  console.log("function nextLevel")
  currentLevel++; // Увеличиваем уровень
  doorFound = false; // Сбрасываем флаг
  doorCell = null; // Сбрасываем клетку двери

  // Очистка игрового поля
  const grid = document.getElementById("grid");
  grid.innerHTML = ""; // Убираем все элементы на поле

  generateGrid();

  resetPlayerPosition();

  // Очистить поле (удалить врагов и бонусы)
  document.querySelectorAll(".enemy").forEach(enemy => enemy.remove());
  document.querySelectorAll(".bonus-icon").forEach(bonus => bonus.remove());
  document.querySelectorAll(".explosion").forEach(explosion => explosion.remove());

  // Сбрасываем таймер
  timeLeft = 180;
  updateTimerDisplay();

  // Спавним новых врагов
  spawnEnemiesForCurrentLevel();

  // Размещение двери для следующего уровня
  placeDoor();

  document.querySelector(".stage").textContent = `ЭТАП ${currentLevel}`;

}

// Вызову функции при нажатии "E"
document.addEventListener("keydown", e => {
  if (e.key === "e" || e.key === "E" || e.key === "У" || e.key === "у") {
    const playerCell = player.parentElement;

    if (allEnemiesDead() && playerCell === doorCell) {
      nextLevel();
    }
  }
});

document.addEventListener("keydown", e => {
  if (e.key === "G" || e.key === "g") {
      nextLevel();
  }
});

function allEnemiesDead() {
  return document.querySelectorAll(".enemy").length === 0;
}

function updateScore() {
  document.getElementById("score").textContent = score; // Обновляем текст с текущим счетом
}


spawnEnemiesForCurrentLevel()