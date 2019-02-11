const size = 10;
const BONUS = 10;
const GAME_PLAYER_SCORE_ID = 'game-score';
const START_SCORE = 0;
const TOP_RESULT = 'bestResult';
const CURRENT_RESULT = 'currentResult';
const PAUSE_BUTTON = 'game-status';
const BEST_RESULT_UI = 'best-result_score';
const BUTTON_PAUSE = 'Pause';
const BUTTON_CONTINUE = 'Continue';
const SNAKE_COLOR = 'lightgray';
const FOOD_COLOR = 'darkcyan';
const FIELD_COLOR = 'white';
let gameState = true;
let score = 0;
let intervalId;
const INITIAL_DIV = 'init-state';
let food = ['food', '', []];
const snake = [];
const snakeBlueprintData = [['head', '', [2, 3]], ['body', '', [2, 2]], ['body', '', [2, 1]]];
let gridItem;


const changeScoreAmountOnUI = (score, elementId) => document.getElementById(elementId).innerHTML = score;

const counter = function(){
    let score = 0;

    function addToCurrentScore(){
        return score+=BONUS
    }

    function resetScore(){
        score = 0;
    }

    return{
        addToCurrentScore:addToCurrentScore,
        resetScore:resetScore
    }

}();

const clearDivContent = function () {
    function clearDOMTree(idName) {
        let div = document.getElementById(idName);
        clearInner(div);
    }

    function clearInner(node) {
        while (node.hasChildNodes()) {
            clear(node.firstChild);
        }
    }

    function clear(node) {
        while (node.hasChildNodes()) {
            clear(node.firstChild);
        }
        node.parentNode.removeChild(node);
    }

    return {
        clear: clearDOMTree
    }
}();


const mediator = function () {
    const handlers = [];

    function addHandler(handler) {
        if (isValidHandler(handler)) {
            handlers.push(handler);
            return this;
        }
        let error = new Error('Attempt to register an invalid handler with the mediator.');
        error.handler = handler;
        throw error;
    }

    function isValidHandler(handler) {
        return (typeof handler.canHandle === 'function') &&
            (typeof handler.handle === 'function');
    }

    function request(message) {
        for (let i = 0; i < handlers.length; i++) {
            let handler = handlers[i];
            if (handler.canHandle(message)) {
                return handler.handle(message);
            }
        }
        let error = new Error('Mediator was unable to satisfy request.');
        error.request = message;
        return error;
    }

    return {
        addHandler: addHandler,
        request: request
    }

}();

const mainTemplate = `<div class="game">
    <div class="game-name">
        <h1>Game snake v 0.1</h1>
        <div class="game-link">
             <input id="start-game" type="submit" value="Start game"/>
        </div>
    </div>
</div>`;


const mainPageHandler = {
    canHandle: function (message) {
        return message.name === 'main';
    },
    handle: function (message) {
        const divElem = document.getElementById(INITIAL_DIV);
        divElem.insertAdjacentHTML('afterbegin', mainTemplate);
        return {
            name: 'main'
        };
    }
};

const gameTemplate = `
<div id="game-container">
    <div class="game-info">
        <div class="game-info_score">
            <div class="game-score_current">Your score:</div>
            <div id="game-score">0</div>
        </div>
        <div class="game-info_best-result">
            <div class="best-result_sign">Best score:</div>
            <div id="best-result_score">0</div>
        </div>
        <div id="game-status">Pause</div>
        <div class="game-help">Press up/down/left/right arrow to start the game.</div>
    </div>
    <div class="grid-container">
    </div>
</div>`;

const gamePageHandler = {
    canHandle: function (message) {
        return message.name === 'game';
    },
    handle: function (message) {
        const divElem = document.getElementById(INITIAL_DIV);
        divElem.insertAdjacentHTML('afterbegin', gameTemplate);
        let elem = document.getElementsByClassName('grid-container')[0];
        elem.style.gridTemplateColumns = "auto ".repeat(size - 1) + "auto";
        for (let i = 0; i < size * size; i++) {
            let div = document.createElement('div');
            div.className = "grid-item";
            elem.appendChild(div)
        }
        gridItem = Array.from(document.getElementsByClassName('grid-item'));
        localStorageWorker.set(CURRENT_RESULT, 0);
        counter.resetScore();
        let currentBestScore = localStorageWorker.get(TOP_RESULT);
        let displayOnUIBestScore = currentBestScore ? currentBestScore : 0;
        changeScoreAmountOnUI(displayOnUIBestScore, BEST_RESULT_UI);

        return {
            name: 'game'
        };
    }
};


const gameResult = `
    <div class="game-result">
        <div class="game-info">
            <div class="game-info_score">
                <div class="game-score_current">Your score:</div>
                <div id="game-score">0</div>
            </div>
            <div class="game-info_best-result">
                <div class="best-result_sign">Best score:</div>
                <div id="best-result_score">0</div>
            </div>
            <div id="game-play-again">Play again</div>
        </div>
    </div>`;


const resultPageHandler = {
    canHandle: function (message) {
        return message.name === 'result';
    },
    handle: function (message) {
        clearDivContent.clear(INITIAL_DIV);
        const divElem = document.getElementById(INITIAL_DIV);
        divElem.insertAdjacentHTML('afterbegin', gameResult);
        let currentBestScore = localStorageWorker.get(TOP_RESULT);
        let currentResult = localStorageWorker.get(CURRENT_RESULT);
        let displayOnUIBestScore = currentBestScore ? currentBestScore : 0;
        changeScoreAmountOnUI(displayOnUIBestScore, BEST_RESULT_UI);
        changeScoreAmountOnUI(currentResult, 'game-score');
        return {
            name: 'result'
        };
    }

};


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
                        color.style.backgroundColor = SNAKE_COLOR;
                    }
                    if (food[2][0] === i && food[2][1] === j) {
                        let pos = gridItemChunked[i][j];
                        let color = gridItem[Number(pos)];
                        color.style.backgroundColor = FOOD_COLOR;
                    }
                } else {
                    let pos = gridItemChunked[i][j];
                    let color = gridItem[Number(pos)];
                    color.style.backgroundColor = FIELD_COLOR;
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

    function handleMovement(direction, snake, func) {
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

    function handleAction(snake, food, gridItemChunked, gridItem, gameState, snakeDirection = undefined) {
        let currentState = utils.makeArrayDeepCopy(gridItemChunked);
        if (handleSnakeBodyCollision(snake) || handleGameFieldCollision(snake, gridItemChunked)) {
            console.log('collision detected');
            gameState = false;
            if (!gameState) {
                let gameResult = localStorageWorker.compareCurrentWithBestResultAndReturnHigher(TOP_RESULT, score);
                localStorageWorker.set(TOP_RESULT, gameResult);
                localStorageWorker.set(CURRENT_RESULT, score);
                interval.stop();
                let request = {name: 'result'};
                let reply = mediator.request(request);
                snake.length = 0;
            }
        } else {
            let fieldWithMappedSnake = gameField.gameFieldMapping(snake, currentState);
            food = foodWorker.generateFoodOnTheField(fieldWithMappedSnake, food, gridItemChunked);
            foodWorker.handleFood(food, snake, snakeDirection, moveToDecidedDirection, gridItemChunked);
            gameField.drawGameFieldWithSnakeAndFood(fieldWithMappedSnake, food, gridItem, gridItemChunked);
        }

    }

    return {
        handleAction: handleAction,
        handleMovement: handleMovement
    }
}();


const foodWorker = function () {
    function generateFoodOnTheField(gameField, food, initGameField) {
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


    function handleFood(food, snake, direction, func, gameField) {
        let newSnakePosition = JSON.parse(JSON.stringify(snake)).slice(-1);
        snakeHandler.handleMovement(direction, snake, func);
        if (snake[0]['currentPosition'][0] === food[2][0] && snake[0]['currentPosition'][1] === food[2][1]) {
            food[2] = [];
            score = counter.addToCurrentScore();
            changeScoreAmountOnUI(score, GAME_PLAYER_SCORE_ID);
            snake.push(snakeBody.createPiece('body', newSnakePosition[0]['direction'], newSnakePosition[0]['currentPosition'].slice()))
        }
        return true
    }

    return {
        generateFoodOnTheField: generateFoodOnTheField,
        handleFood: handleFood
    }
}();

const interval = function () {
    let intervalStatus = 0;

    function start(func, params) {
        intervalStatus = setInterval(func.bind(null, ...params), 300)
    }

    function stop() {
        clearInterval(intervalStatus);
    }

    return {
        start: start,
        stop: stop
    }
}();


let gridItemChunked = gameField.splitArrayToChunks(gameField.createGameField(size), size);


document.addEventListener('DOMContentLoaded', function (event) {
    mediator.addHandler(mainPageHandler);
    mediator.addHandler(gamePageHandler);
    mediator.addHandler(resultPageHandler);
    let request = {name: 'main'};
    let reply = mediator.request(request);
}, false);

document.addEventListener('click', e => {
    if (e.target && (e.target.id === 'start-game' || e.target.id === 'game-play-again')) {
        clearDivContent.clear(INITIAL_DIV);
        let request = {name: 'game'};
        gameState = true;
        mediator.request(request);
    }

    if (e.target && e.target.id === PAUSE_BUTTON) {
        let button = document.getElementById(e.target.id);
        if (button.innerText === BUTTON_PAUSE) {
            button.innerText = BUTTON_CONTINUE;
            interval.stop()
        } else {
            button.innerText = BUTTON_PAUSE;
            interval.start(snakeHandler.handleAction, [snake, food, gridItemChunked, gridItem, gameState])
        }
    }
});

document.addEventListener('keydown', function (event) {
    const key = event.key;
    if (document.getElementById('game-container')) {
        if (snake.length === 0) {
            snakeBody.createSnake(snake, snakeBlueprintData);
        }
        if (intervalId !== undefined) {
            interval.stop();
        }
        interval.stop();
        interval.start(snakeHandler.handleAction, [snake, food, gridItemChunked, gridItem, gameState, key])
    }
});
