const size = 10;
const BONUS = 10;
const GAME_PLAYER_SCORE_ID = 'game-score';
const START_SCORE = 0;

function countScore(score) {
    return function () {
        return score += BONUS
    }
}

let setCurrentScore = countScore(START_SCORE);

let changeScoreAmountOnUI = (score, elementId) => {
    let scoreId = document.getElementById(elementId);
    scoreId.innerHTML = score
};


let moveToDecidedDirection = (currentPosition, direction) => {
    let currentPositionCopy = [...currentPosition];
    if (direction === 'ArrowUp') {
        let newPos = currentPositionCopy.shift();
        currentPositionCopy.unshift(--newPos);
    }

    if (direction === 'ArrowDown') {
        let newPos = currentPositionCopy.shift();
        currentPositionCopy.unshift(++newPos);
    }

    if (direction === 'ArrowRight') {
        let newPos = currentPositionCopy.pop();
        currentPositionCopy.push(++newPos);
    }

    if (direction === 'ArrowLeft') {
        let newPos = currentPositionCopy.pop();
        currentPositionCopy.push(--newPos);
    }

    return currentPositionCopy;
};


let createPiece = (bodyPart, direction, currentPosition, func) => {
    let nextPos = [];
    if (typeof func === 'function') {
        nextPos = func(currentPosition, direction)
    }
    return {
        'part': bodyPart,
        'direction': direction,
        'currentPosition': currentPosition,
        'nextPosition': nextPos
    }
};

let makeArrayDeepCopy = array => JSON.parse(JSON.stringify(array));

let handleMovement = (direction, snake, func) => {
    console.log('handleMovement', direction, JSON.stringify(snake));
    let newSnakePosition = JSON.parse(JSON.stringify(snake));
    if (direction === undefined) {
        direction = snake[0]['direction']
    }
    snake.forEach((value, index) => {
        if (value['part'] === 'head') {
            value['direction'] = direction;
            value['currentPosition'] = func(value['currentPosition'], direction);
        } else {
            value['direction'] = newSnakePosition[index - 1]['direction'];
            value['currentPosition'] = [...newSnakePosition[index - 1]['currentPosition']];
            value['nextPosition'] = func(value['currentPosition'], newSnakePosition[index - 1]['direction'])
        }
    });
    console.log(JSON.stringify(snake));
    return [...snake]
};


let handleSnakeBodyCollision = (snake) => {
    for (let i = 1; i < snake.length; i++) {
        if (snake[0]['currentPosition'][0] === snake[i]['currentPosition'][0] && snake[0]['currentPosition'][1] === snake[i]['currentPosition'][1]) {
            return true;
        }
    }
    return false;
};

let handleGameFieldCollision = (snake, gameField) => {
    let position = snake[0]['currentPosition'];
    if (position[0] < gameField.length
        && position[0] >= 0 && position[1] >= 0
        && position[1] < gameField[0].length) {
        return false;
    }
    return true;
};


let handleFood = (food, snake, direction, func, gameField) => {
    let newSnakePosition = JSON.parse(JSON.stringify(snake)).slice(-1);
    // if (handleSnakeBodyCollision(snake) || handleGameFieldCollision(snake, gameField)) {
    //     return false;
    // }
    handleMovement(direction, snake, func);
    if (snake[0]['currentPosition'][0] === food[2][0] && snake[0]['currentPosition'][1] === food[2][1]) {
        food[2] = [];
        let bonusScore = setCurrentScore();
        changeScoreAmountOnUI(bonusScore, GAME_PLAYER_SCORE_ID);
        snake.push(createPiece('body', newSnakePosition[0]['direction'], newSnakePosition[0]['currentPosition'].slice()))
    }
    return true
};


const splitArrayToChunks = (array, chunkSize) => {
    let chunkedArray = [];
    let counter = 0;
    let tempArray = [];
    for (let i = 0; i < array.length; i++) {
        if (counter < chunkSize) {
            tempArray.push(array[i]);
            counter += 1
        }
        if (counter === chunkSize) {
            counter = 0;
            chunkedArray.push(tempArray.slice());
            tempArray = [];
        }
    }
    return chunkedArray;
};


let generateRandomValue = (min, max) => {
    let randomNumber = Math.random() * (max - min) + min;
    return Math.floor(randomNumber)
};

let sortArray = (array, elementShouldBeExcluded) => {
    let arrayCopy = makeArrayDeepCopy(array);
    for (let i = 0; i < arrayCopy.length; i++) {
        arrayCopy[i] = arrayCopy[i].filter(value => value !== elementShouldBeExcluded);
    }
    return arrayCopy;
};

let getRandomElementInArray = (array) => {
    return [generateRandomValue(0, array.length), generateRandomValue(0, array[0].length)]
};


let gameFieldMapping = (snake, gameField) => {
    snake.forEach(v => {
        let row = v['currentPosition'][0];
        let column = v['currentPosition'][1];
        gameField[row][column] = 'x'
    });
    return gameField.slice()
};

let returnArrayPositionByValue = (value, array) => {
    let position = [];
    for (let i = 0; i < array.length; i++) {
        let columnPos = array[i].indexOf(value);
        if (columnPos !== -1) {
            position.push(i);
            position.push(columnPos)
        }
    }
    return position;
};

let generateFoodOnTheField = (gameField, food, initGameField) => {
    if (food[2].length === 0) {
        let freeCells = sortArray(gameField, 'x');
        let freeCell = getRandomElementInArray(freeCells);
        let value = gameField[freeCell[0]][freeCell[1]];
        let positionInArray = returnArrayPositionByValue(value, initGameField);
        food[2] = positionInArray;
        return food
    }
    return food
};


let drawGameFieldWithSnakeAndFood = (fieldWithMappedSnake, food, gridItem, gridItemChunked) => {
    for (let i = 0; i < gridItemChunked.length; i++) {
        for (let j = 0; j < gridItemChunked[0].length; j++) {
            if (fieldWithMappedSnake[i][j] === 'x' || food[2][0] === i && food[2][1] === j) {
                if (fieldWithMappedSnake[i][j] === 'x') {
                    let pos = gridItemChunked[i][j];
                    let color = gridItem[Number(pos)];
                    color.style.backgroundColor = 'lightgray';
                }
                if (food[2][0] === i && food[2][1] === j) {
                    let pos = gridItemChunked[i][j];
                    let color = gridItem[Number(pos)];
                    color.style.backgroundColor = 'darkcyan'
                }
            } else {
                let pos = gridItemChunked[i][j];
                let color = gridItem[Number(pos)];
                color.style.backgroundColor = 'white'
            }
        }
    }
};


let handleAction = (snake, food, snakeDirection, gridItemChunked, gridItem) => {
    let currentState = makeArrayDeepCopy(gridItemChunked);
    //TODO fix it
    if (handleSnakeBodyCollision(snake) || handleGameFieldCollision(snake, gridItemChunked)) {
        // return false;
        alert("YOU LOOSE")
    }
    fieldWithMappedSnake = gameFieldMapping(snake, currentState);
    food = generateFoodOnTheField(fieldWithMappedSnake, food, gridItemChunked);
    gameResult = handleFood(food, snake, snakeDirection, moveToDecidedDirection, gridItemChunked);
    drawGameFieldWithSnakeAndFood(fieldWithMappedSnake, food, gridItem, gridItemChunked);
};

const gameField = Array.from({length: Math.pow(size, 2)}, (x, i) => i);
let gridItem;

document.addEventListener('DOMContentLoaded', function (event) {

    let elem = document.getElementsByClassName('grid-container')[0];
    elem.style.gridTemplateColumns = "auto ".repeat(size - 1) + "auto";
    for (let i = 0; i < size * size; i++) {
        let div = document.createElement('div');
        div.className = "grid-item";
        elem.appendChild(div)
    }

    gridItem = Array.from(document.getElementsByClassName('grid-item'));
}, false);
let gridItemChunked = splitArrayToChunks(gameField, size);
let food = ['food', '', []];
const snake = [];
var gameResult = '';
const snakeBlueprintData = [['head', '', [2, 2]]];
snakeBlueprintData.forEach(value => {
    let z = createPiece(value[0], value[1], value[2], moveToDecidedDirection);
    snake.push(z)
});

let snakeDirection;
let intervalId;


document.addEventListener('keydown', function (event) {
    const key = event.key;
    console.log('press', key);
    if (intervalId !== undefined) {
        clearInterval(intervalId);
    }
    intervalId = setInterval(handleAction.bind(null, snake, food, key, gridItemChunked, gridItem), 300);
});










