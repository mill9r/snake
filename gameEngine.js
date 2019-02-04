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


const countScore = score => () => score += BONUS;
const setCurrentScore = countScore(START_SCORE);
const changeScoreAmountOnUI = (score, elementId) => {
    const scoreId = document.getElementById(elementId);
    scoreId.innerHTML = score
};
const checkElemPositionIn2DArray = (pos, array) => pos[0] >= 0 && pos[0] < array.length && pos[1] >= 0 && pos[1] < array[1].length;
const makeArrayDeepCopy = array => JSON.parse(JSON.stringify(array));
const generateRandomValue = (min, max) => Math.floor(Math.random() * (max - min) + min);


class LocalStorageWorker {
    set(key, value) {
        localStorage.setItem(key, value);
    }

    get(key) {
        return localStorage.getItem(key);
    }

    clear() {
        localStorage.clear();
    }

    compareCurrentWithBestResultAndReturnHigher(key, current) {
        let oldResult = this.get(key);
        return oldResult > current ? oldResult : current;
    }
}

class Snake {
    constructor() {
        this.snake = [];
        this.snakeBlueprintData = [
            ['head', '', [2, 3]],
            ['body', '', [2, 2]],
            ['body', '', [2, 1]]
        ];
    }

    init(moveToDecidedDirection) {
        this.snakeBlueprintData.forEach(value => {
            this.snake.push(this.generatePieceOfSnake(value[0], value[1], value[2], moveToDecidedDirection));
        });
    }

    get() {
        return this.snake;
    }

    generatePieceOfSnake(bodyPart, direction, currentPosition, func) {
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


}

class SnakeWorker {

    moveToDecidedDirection(currentPosition, direction) {
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

    handleMovement(direction, snake, func) {
        let newSnakePosition = makeArrayDeepCopy(snake);
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
        return snake
    };

    handleGameFieldCollision(snake, gameField) {
        return !checkElemPositionIn2DArray(snake[0]['currentPosition'], gameField);
    }

    handleSnakeBodyCollision(snake) {
        for (let i = 1; i < snake.length; i++) {
            if (snake[0]['currentPosition'][0] === snake[i]['currentPosition'][0] && snake[0]['currentPosition'][1] === snake[i]['currentPosition'][1]) {
                return true;
            }
        }
        return false;
    };

    handleAction(snake, food, gridItemChunked, gridItem, gameState, gameField, snakeWorker, snakeDirection) {
        console.log('this: ', this);
        console.log(JSON.stringify(snake));
        let currentState = makeArrayDeepCopy(gridItemChunked);
        if (this.handleSnakeBodyCollision(snake.get()) || this.handleGameFieldCollision(snake.get(), gridItemChunked)) {
            gameState = false;
            if (!gameState) {
                let storage = new LocalStorageWorker();
                let gameResult = storage.compareCurrentWithBestResultAndReturnHigher(TOP_RESULT, score);
                storage.set(TOP_RESULT, gameResult);
                clearInterval(intervalId);
            }
        } else {
            let fieldWithMappedSnake = gameField.gameFieldMapping(snake, currentState);
            let foodPiece = food.generateFoodOnTheField(fieldWithMappedSnake, food, gridItemChunked);
            food.handleFood(foodPiece, snake, snake.snakeDirection, snake.moveToDecidedDirection, gridItemChunked, snakeWorker);
            gameField.drawGameFieldWithSnakeAndFood(fieldWithMappedSnake, food, gridItem, gridItemChunked);
        }

    };
}

class GameField {
    constructor(size) {
        this.gameField = Array.from({
            length: Math.pow(size, 2)
        }, (x, i) => i);
    }

    get() {
        return this.gameField;
    }


    drawGameFieldWithSnakeAndFood(fieldWithMappedSnake, food, gridItem, gridItemChunked) {
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

    gameFieldMapping(snake, gameField) {
        snake.forEach(value => {
            let position = value['currentPosition'];
            if (checkElemPositionIn2DArray(position, gameField)) {
                let row = value['currentPosition'][0];
                let column = value['currentPosition'][1];
                gameField[row][column] = 'x'
            }

        });
        return makeArrayDeepCopy(gameField)
    };

    splitArrayToChunks(chunkSize) {
        let chunkedArray = [];
        let counter = 0;
        let tempArray = [];
        for (let i = 0; i < this.gameField.length; i++) {
            if (counter < chunkSize) {
                tempArray.push(this.gameField[i]);
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

}

class FoodWorker {
    constructor() {
        this.food = ['food', '', []];
    }

    getRandomElementInArray(array) {
        return [generateRandomValue(0, array.length), generateRandomValue(0, array[0].length)];
    }


    returnArrayPositionByValue(value, array) {
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

    sortArray(array, elementShouldBeExcluded) {
        let arrayCopy = makeArrayDeepCopy(array);
        for (let i = 0; i < arrayCopy.length; i++) {
            arrayCopy[i] = arrayCopy[i].filter(value => value !== elementShouldBeExcluded);
        }
        return arrayCopy;
    };

    generateFoodOnTheField(gameField, food, initGameField) {
        if (food[2].length === 0) {
            let freeCells = this.sortArray(gameField, 'x');
            let freeCell = this.getRandomElementInArray(freeCells);
            let value = gameField[freeCell[0]][freeCell[1]];
            let positionInArray = this.returnArrayPositionByValue(value, initGameField);
            food[2] = positionInArray;
            return food
        }
        return food
    };

    handleFood(food, snake, direction, func, gameField, snakeWorker) {
        let newSnakePosition = JSON.parse(JSON.stringify(snake.get())).slice(-1);
        snakeWorker.handleMovement(direction, snake.get(), func);
        if (snake.get()[0]['currentPosition'][0] === food[2][0] && snake.get()[0]['currentPosition'][1] === food[2][1]) {
            food[2] = [];
            score = setCurrentScore();
            changeScoreAmountOnUI(score, GAME_PLAYER_SCORE_ID);
            snake.push(snake.generatePieceOfSnake('body', newSnakePosition[0]['direction'], newSnakePosition[0]['currentPosition'].slice()))
        }
        return true
    };

}


let gridItem;
// let pauseButton;

document.addEventListener('DOMContentLoaded', function (event) {

    let elem = document.getElementsByClassName('grid-container')[0];
    elem.style.gridTemplateColumns = "auto ".repeat(size - 1) + "auto";
    for (let i = 0; i < size * size; i++) {
        let div = document.createElement('div');
        div.className = "grid-item";
        elem.appendChild(div)
    }
    gridItem = Array.from(document.getElementsByClassName('grid-item'));
    let storage = new LocalStorageWorker();
    let currentBestScore = storage.get(TOP_RESULT);
    let displayOnUIBestScore = currentBestScore ? currentBestScore : 0;
    changeScoreAmountOnUI(displayOnUIBestScore, BEST_RESULT_UI);

}, false);

let gameField = new GameField();
let snakeWorker = new SnakeWorker();
let gridItemChunked = gameField.splitArrayToChunks(gameField.get, size);
let food = new FoodWorker();
let snake = new Snake();
snake.init(snakeWorker.moveToDecidedDirection);


const pauseButton = document.getElementById(PAUSE_BUTTON);
pauseButton.addEventListener('click', function (event) {
    clearInterval(intervalId);
    if (pauseButton.innerText === 'Pause') {
        pauseButton.innerText = 'Continue';
        clearInterval(intervalId);
    } else {
        pauseButton.innerText = 'Pause';
        intervalId = setInterval(snakeWorker.handleAction.bind(snakeWorker, snake, food, gridItemChunked, gridItem, gameState, gameField, snakeWorker), 300);
    }
});


document.addEventListener('keydown', function (event) {
    const key = event.key;
    console.log('press', key, ', intervalId:', intervalId);
    if (intervalId !== undefined) {
        clearInterval(intervalId);
    }
    intervalId = setInterval(snakeWorker.handleAction.bind(snakeWorker, snake, food, gridItemChunked, gridItem, gameState, gameField, snakeWorker, key), 300);
});
