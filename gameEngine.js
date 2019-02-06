const size = 10;
const BONUS = 10;
const GAME_PLAYER_SCORE_ID = 'game-score';
const START_SCORE = 0;
const TOP_RESULT = 'best-result';
const PAUSE_BUTTON = 'game-status';
const BEST_RESULT_UI = 'best-result_score';
let gameState = true;
let score = 0;
let intervalId;
let food = ['food', '', []];
const snake = [];
const snakeBlueprintData = [['head', '', [2, 3]], ['body', '', [2, 2]], ['body', '', [2, 1]]];
const countScore = score => () => score += BONUS;
const setCurrentScore = countScore(START_SCORE);
const changeScoreAmountOnUI = (score, elementId) => document.getElementById(elementId).innerHTML = score;


const utils = function () {
    function checkElemPositionIn2DArray(pos, array) {
        return pos[0] >= 0 && pos[0] < array.length && pos[1] >= 0 && pos[1] < array[1].length;
    }

    function makeArrayDeepCopy(array) {
        return JSON.parse(JSON.stringify(array));
    }

    function generateRandomValue(min, max) {
        return Math.floor(Math.random() * (max - min) + min);
    }

    function getRandomElementInArray(array) {
        return [generateRandomValue(0, array.length), generateRandomValue(0, array[0].length)];
    }

    function sortArray(array, elementShouldBeExcluded) {
        let arrayCopy = makeArrayDeepCopy(array);
        for (let i = 0; i < arrayCopy.length; i++) {
            arrayCopy[i] = arrayCopy[i].filter(value => value !== elementShouldBeExcluded);
        }
        return arrayCopy;
    }

    function returnArrayPositionByValue(value, array) {
        let position = [];
        for (let i = 0; i < array.length; i++) {
            let columnPos = array[i].indexOf(value);
            if (columnPos !== -1) {
                position.push(i);
                position.push(columnPos)
            }
        }
        return position;
    }

    return {
        checkElemPositionIn2DArray: checkElemPositionIn2DArray,
        makeArrayDeepCopy: makeArrayDeepCopy,
        getRandomElementInArray: getRandomElementInArray,
        sortArray: sortArray,
        returnArrayPositionByValue: returnArrayPositionByValue
    }

}();


const localStorageWorker = function () {

    function set(key, value) {
        localStorage.setItem(key, value);
    }

    function get(key) {
        return localStorage.getItem(key);
    }

    function clear() {
        localStorage.clear();
    }

    function compareCurrentWithBestResultAndReturnHigher(key, current) {
        let oldResult = this.get(key);
        return oldResult > current ? oldResult : current;
    }

    return {
        set: set,
        get: get,
        clear: clear,
        compareCurrentWithBestResultAndReturnHigher: compareCurrentWithBestResultAndReturnHigher
    }
}();

const gameField = function () {
    function gameFieldMapping(snake, gameField) {
        snake.forEach(v => {
            let position = v['currentPosition'];
            if (utils.checkElemPositionIn2DArray(position, gameField)) {
                let row = v['currentPosition'][0];
                let column = v['currentPosition'][1];
                gameField[row][column] = 'x'
            }

        });
        return gameField
    }

    function drawGameFieldWithSnakeAndFood(fieldWithMappedSnake, food, gridItem, gridItemChunked) {
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
    }

    function createGameField(size) {
        return Array.from({length: Math.pow(size, 2)}, (x, i) => i);
    }

    function splitArrayToChunks(array, chunkSize) {
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
    }

    return {
        gameFieldMapping: gameFieldMapping,
        drawGameFieldWithSnakeAndFood: drawGameFieldWithSnakeAndFood,
        createGameField: createGameField,
        splitArrayToChunks: splitArrayToChunks
    }
}();

const snakeBody = function () {
    function createPiece(bodyPart, direction, currentPosition, func) {
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
    }


    function createSnake(snake, blueprint) {
        blueprint.forEach(value => {
            snake.push(createPiece(value[0], value[1], value[2], snakeHandler.moveToDecidedDirection));
        });
    }

    return {
        createPiece: createPiece,
        createSnake: createSnake
    }
}();

const snakeHandler = function () {
    function moveToDecidedDirection(currentPosition, direction) {
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
    }

    function handleGameFieldCollision(snake, gameField) {
        return !utils.checkElemPositionIn2DArray(snake[0]['currentPosition'], gameField);
    }

    function handleSnakeBodyCollision(snake) {
        return !snake.some(elem => snake[0]['currentPosition'][0] === elem['currentPosition'][0] && snake[0]['currentPosition'][1] === elem['currentPosition'][1]);
    }

    function handleMovement (direction, snake, func) {
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
        return [...snake]
    }

    return {
        moveToDecidedDirection: moveToDecidedDirection,
        handleGameFieldCollision: handleGameFieldCollision,
        handleSnakeBodyCollision: handleSnakeBodyCollision,
        handleMovement:handleMovement
    }
}();


const foodWorker = function(){
    function generateFoodOnTheField (gameField, food, initGameField){
        if (food[2].length === 0) {
            let freeCells = utils.sortArray(gameField, 'x');
            let freeCell = utils.getRandomElementInArray(freeCells);
            let value = gameField[freeCell[0]][freeCell[1]];
            let positionInArray = utils.returnArrayPositionByValue(value, initGameField);
            food[2] = positionInArray;
            return food
        }
        return food
    }



    function handleFood (food, snake, direction, func, gameField) {
        let newSnakePosition = JSON.parse(JSON.stringify(snake)).slice(-1);
        snakeHandler.handleMovement(direction, snake, func);
        if (snake[0]['currentPosition'][0] === food[2][0] && snake[0]['currentPosition'][1] === food[2][1]) {
            food[2] = [];
            score = setCurrentScore();
            changeScoreAmountOnUI(score, GAME_PLAYER_SCORE_ID);
            snake.push(snakeBody.createPiece('body', newSnakePosition[0]['direction'], newSnakePosition[0]['currentPosition'].slice()))
        }
        return true
    }

    return{
        generateFoodOnTheField:generateFoodOnTheField,
        handleFood:handleFood
    }
}();

let handleAction = (snake, food, gridItemChunked, gridItem, gameState, snakeDirection) => {
    let currentState = utils.makeArrayDeepCopy(gridItemChunked);
    if (snakeHandler.handleSnakeBodyCollision(snake) || snakeHandler.handleGameFieldCollision(snake, gridItemChunked)) {
        console.log('collision detected');
        gameState = false;
        if (!gameState) {
            let gameResult = localStorageWorker.compareCurrentWithBestResultAndReturnHigher(TOP_RESULT, score);
            localStorageWorker.set(TOP_RESULT, gameResult);
            clearInterval(intervalId);
        }
    } else {
        let fieldWithMappedSnake = gameField.gameFieldMapping(snake, currentState);
        food = foodWorker.generateFoodOnTheField(fieldWithMappedSnake, food, gridItemChunked);
        foodWorker.handleFood(food, snake, snakeDirection, snakeHandler.moveToDecidedDirection, gridItemChunked);
        gameField.drawGameFieldWithSnakeAndFood(fieldWithMappedSnake, food, gridItem, gridItemChunked);
    }

};

snakeBody.createSnake(snake, snakeBlueprintData);
let gridItemChunked = gameField.splitArrayToChunks(gameField.createGameField(size), size);
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
    let currentBestScore = localStorageWorker.get(TOP_RESULT);
    let displayOnUIBestScore = currentBestScore ? currentBestScore : 0;
    changeScoreAmountOnUI(displayOnUIBestScore, BEST_RESULT_UI);

}, false);


const pauseButton = document.getElementById(PAUSE_BUTTON);
pauseButton.addEventListener('click', function (event) {
    clearInterval(intervalId);
    if (pauseButton.innerText === 'Pause') {
        pauseButton.innerText = 'Continue';
        clearInterval(intervalId);
    } else {
        pauseButton.innerText = 'Pause';
        intervalId = setInterval(handleAction.bind(null, snake, food, gridItemChunked, gridItem, gameState), 300);
    }
});

document.addEventListener('keydown', function (event) {
    const key = event.key;
    if (intervalId !== undefined) {
        clearInterval(intervalId);
    }
    intervalId = setInterval(handleAction.bind(null, snake, food, gridItemChunked, gridItem, gameState, key), 300);
});












