const startButton = document.getElementById('start-button');
const submitButton = document.getElementById('submit-button');
const saveButton = document.getElementById('save-button');
const gameScreen = document.getElementById('game-screen');
const startScreen = document.getElementById('start-screen');
const gameCanvas = document.getElementById('game-canvas');
const gameOverScreen = document.getElementById('game-over');
const resultText = document.getElementById('result-text');
const restartButton = document.getElementById('restart-button');
const inputText = document.getElementById('input-text');
const timerElement = document.getElementById('time-elapsed');
const eatenWordsElement = document.getElementById('eaten-content');
const infoTextElement = document.getElementById('info-text');
const gameTopics = document.getElementById('game-topics');
const topicsList = document.getElementById('topics-list');
const ctx = gameCanvas.getContext('2d');

let snake = [{x: 10, y: 10}];
let direction = {x: 0, y: 0};
let food = [];
let gameInterval;
let foodCount = 0;
let gameOver = false;
let textGroups = [];
let currentGroup = [];
let currentCharIndex = 0;
let timeElapsed = 0;
let eatenWords = [];
let infoText = "";
let remainingFood = [];
let startTime;

submitButton.addEventListener('click', () => {
    const inputTextValue = inputText.value.trim();
    if (inputTextValue.length === 0) {
        alert("請輸入一些文本");
        return;
    }

    textGroups = inputTextValue.split('\n').map(line => {
        const parts = line.split(/,|\t/); // 支持逗号和tab分隔
        return { words: parts[0].trim().split(''), info: parts[1] ? parts[1].trim() : '' };
    });

    // 顯示遊戲題目
    topicsList.innerHTML = '';
    textGroups.forEach(group => {
        const li = document.createElement('li');
        li.textContent = group.words.join('');
        topicsList.appendChild(li);
    });
    gameTopics.style.display = 'block';

    localStorage.setItem('inputText', inputTextValue); // 保存输入内容到localStorage
    if (textGroups.length > 0) {
        startButton.style.display = 'block';
        saveButton.style.display = 'block';
    }
});

startButton.addEventListener('click', () => {
    startScreen.style.display = 'none';
    gameScreen.style.display = 'flex';
    startGame();
});

saveButton.addEventListener('click', () => {
    const inputTextValue = inputText.value.trim();
    if (inputTextValue.length === 0) {
        alert("請先送出一些文本");
        return;
    }

    const htmlContent = generateHTMLContent(inputTextValue);
    downloadFile('snake_game.html', htmlContent);
});

restartButton.addEventListener('click', () => {
    gameOverScreen.style.display = 'none';
    resetGame();
    startGame();
});

document.getElementById('up').addEventListener('click', () => setDirection(0, -1));
document.getElementById('down').addEventListener('click', () => setDirection(0, 1));
document.getElementById('left').addEventListener('click', () => setDirection(-1, 0));
document.getElementById('right').addEventListener('click', () => setDirection(1, 0));

document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowUp') setDirection(0, -1);
    if (event.key === 'ArrowDown') setDirection(0, 1);
    if (event.key === 'ArrowLeft') setDirection(-1, 0);
    if (event.key === 'ArrowRight') setDirection(1, 0);
    if (event.key === 'r' || event.key === 'R') {
        if (gameScreen.style.display === 'flex') {
            gameScreen.style.display = 'none';
            startScreen.style.display = 'flex';
        } else if (gameOverScreen.style.display === 'flex') {
            gameOverScreen.style.display = 'none';
            startScreen.style.display = 'flex';
        }
    }
});

function setDirection(x, y) {
    if (!gameOver) {
        direction = {x, y};
    }
}

function startGame() {
    resetGame();
    gameScreen.style.display = 'flex';
    startTime = Date.now();
    gameInterval = setInterval(gameLoop, 100);
    countdown();
    chooseRandomGroup();
    placeRemainingFood();
}

function resetGame() {
    clearInterval(gameInterval);
    snake = [{x: 10, y: 10}];
    direction = {x: 0, y: 0};
    currentGroup = [];
    currentCharIndex = 0;
    foodCount = 0;
    timeElapsed = 0;
    eatenWords = [];
    infoText = "";
    infoTextElement.innerHTML = "";
    eatenWordsElement.innerHTML = '';
    timerElement.textContent = timeElapsed;
    gameOver = false;
    remainingFood = [];
    textGroups = inputText.value.split('\n').map(line => {
        const parts = line.split(/,|\t/); // 支持逗号和tab分隔
        return { words: parts[0].trim().split(''), info: parts[1] ? parts[1].trim() : '' };
    });
}

function chooseRandomGroup() {
    if (textGroups.length > 0) {
        const randomIndex = Math.floor(Math.random() * textGroups.length);
        currentGroup = textGroups[randomIndex].words;
        infoText = textGroups[randomIndex].info;
        infoTextElement.innerHTML = infoText;
        textGroups.splice(randomIndex, 1);
        placeFood();
    } else {
        currentGroup = [];
        endGame();
    }
}

function placeFood() {
    food = currentGroup.map(char => ({
        x: Math.floor(Math.random() * 15), // 修改為15，讓食物出現在較大的區域
        y: Math.floor(Math.random() * 15), // 修改為15，讓食物出現在較大的區域
        char
    }));
}

function placeRemainingFood() {
    remainingFood = textGroups.flatMap(group => group.words.map(char => ({
        x: Math.floor(Math.random() * 15), // 修改為15，讓食物出現在較大的區域
        y: Math.floor(Math.random() * 15), // 修改為15，讓食物出現在較大的區域
        char
    })));
}

function gameLoop() {
    if (currentGroup.length === 0) return;

    update();
    draw();
}

function update() {
    const head = {x: snake[0].x + direction.x, y: snake[0].y + direction.y};

    if (head.x < 0) head.x = 14; // 修改為14，讓蛇頭在較大的區域移動
    if (head.x >= 15) head.x = 0; // 修改為15，讓蛇頭在較大的區域移動
    if (head.y < 0) head.y = 14; // 修改為14，讓蛇頭在較大的區域移動
    if (head.y >= 15) head.y = 0; // 修改為15，讓蛇頭在較大的區域移動

    snake.unshift(head);

    const currentFood = food[currentCharIndex];
    if (head.x === currentFood.x && head.y === currentFood.y) {
        if (currentFood.char === currentGroup[currentCharIndex]) {
            eatenWords.push(currentFood.char);
            eatenWordsElement.innerHTML = eatenWords.join('');
            currentCharIndex++;
            if (currentCharIndex === currentGroup.length) {
                currentCharIndex = 0;
                chooseRandomGroup();
                eatenWords.push('<br>');
                placeRemainingFood();
            }
            foodCount++;
            placeFood();
        } else {
            resetCurrentGroup();
        }
    } else {
        snake.pop();
    }
}

function resetCurrentGroup() {
    currentCharIndex = 0;
    placeFood();
}

function draw() {
    ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);

    ctx.fillStyle = 'green';
    snake.forEach(segment => ctx.fillRect(segment.x * 40, segment.y * 40, 40, 40)); // 修改為40，讓貪吃蛇變大二倍

    ctx.fillStyle = 'red'; 
    ctx.font = 'bold 40px Arial'; // 修改為40，讓文字變大二倍
    remainingFood.forEach(item => {
        ctx.fillStyle = '#FFFFFF'; 
        ctx.fillRect(item.x * 40, item.y * 40, 40, 40); // 修改為40，讓背景變大二倍
        ctx.fillStyle = 'red'; 
        ctx.fillText(item.char, item.x * 40, item.y * 40 + 40); // 修改為40，讓文字變大二倍
    });
    food.forEach(item => {
        ctx.fillStyle = '#FFFFFF'; 
        ctx.fillRect(item.x * 40, item.y * 40, 40, 40); // 修改為40，讓背景變大二倍
        ctx.fillStyle = 'red'; 
        ctx.fillText(item.char, item.x * 40, item.y * 40 + 40); // 修改為40，讓文字變大二倍
    });
}

function countdown() {
    const countdownInterval = setInterval(() => {
        if (gameOver) {
            clearInterval(countdownInterval);
        } else {
            timeElapsed = Math.floor((Date.now() - startTime) / 1000);
            timerElement.textContent = timeElapsed;
        }
    }, 1000);
}

function endGame() {
    clearInterval(gameInterval);
    gameOver = true;
    const totalTime = Math.floor((Date.now() - startTime) / 1000);
    const formattedWords = eatenWords.join('').split('<br>').map(line => line.trim()).filter(line => line !== '');
    const linkedWords = formattedWords.map(word => `<a href="https://pedia.cloud.edu.tw/Entry/Detail?title=${encodeURIComponent(word)}" target="_blank">${word}</a>`).join('<br>');
    resultText.innerHTML = `總遊戲時間:<br><span class="result-time">${totalTime} 秒</span><br>內容:<br>${linkedWords}`;
    gameOverScreen.style.display = 'flex';
}

function generateHTMLContent(inputTextValue) {
    return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>貪吃蛇遊戲</title>
    <style>
        body, html {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            background: linear-gradient(to right, #000428, #004e92); /* 科技感背景 */
            color: #ffffff;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        #start-screen, #game-screen, #game-over {
            display: flex;
            flex-direction: column;
            align-items: center;
            background-color: rgba(0, 0, 0, 0.7);
            padding: 20px;
            border-radius: 15px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
        }
        h1 {
            margin: 0;
            font-size: 36px;
            color: #FFD700; /* 金色 */
        }
        button {
            padding: 10px 20px;
            font-size: 18px;
            cursor: pointer;
            background-color: #1f4068;
            color: #ffffff;
            border: 1px solid #1b1b2f;
            border-radius: 5px;
            margin: 10px;
            transition: background-color 0.3s ease;
        }
        button:hover {
            background-color: #162447;
        }
        #input-text {
            width: 300px;
            height: 100px;
            margin: 10px;
            border-radius: 5px;
            border: 1px solid #1b1b2f;
            padding: 10px;
            font-size: 16px;
            resize: none;
            background-color: #1f4068;
            color: #ffffff;
        }
        #game-screen {
            display: none;
            justify-content: center;
            align-items: center;
            flex-direction: column;
        }
        #game-canvas {
            background-color: #000000;
            border: 1px solid #FFD700;
            width: 600px;
            height: 600px;
            border-radius: 10px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
        }
        .controls {
            position: absolute;
            bottom: 320px; /* 向上移動300px */
            right: 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        .control-row {
            display: flex;
            justify-content: center; /* 水平居中 */
        }
        .control-button {
            width: 90px; /* 1.5倍大小 */
            height: 90px; /* 1.5倍大小 */
            background-color: #1f4068;
            border: 1px solid #1b1b2f;
            border-radius: 5px;
            display: flex;
            justify-content: center;
            align-items: center;
            font-size: 36px; /* 1.5倍大小 */
            cursor: pointer;
            margin: 5px;
            transition: background-color 0.3s ease;
        }
        .control-button:hover {
            background-color: #162447;
        }
        #game-over {
            display: none;
            justify-content: center;
            align-items: center;
            text-align: center;
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
        }
        #game-over .result-time {
            color: #FFD700;
            font-size: 34px;
        }
        #game-over a {
            background-color: #1f4068;
            color: #ffffff;
            text-decoration: none;
            padding: 2px 4px;
            border-radius: 5px;
        }
        #timer, #info-text, #eaten-words {
            background-color: #1f4068;
            border: 2px solid #1b1b2f;
            border-radius: 10px;
            padding: 10px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
        }
        #timer {
            position: absolute;
            top: 10px;
            right: 10px;
            color: #ffffff;
            font-size: 24px;
        }
        #info-text {
            position: absolute;
            top: 10px;
            left: 10px;
            color: #ffffff;
            font-size: 24px;
            width: 200px;
        }
        #eaten-words {
            position: absolute;
            top: 50%;
            left: 10px;
            transform: translateY(-50%);
            color: #ffffff;
            font-size: 24px;
            width: 200px;
        }
        #eaten-words h2 {
            margin: 0;
            font-size: 18px;
            color: #FFD700;
        }
        .button-row {
            display: flex;
            justify-content: center;
            width: 100%;
        }
        #start-button, #save-button {
            background-color: #0000FF;
            margin: 10px 5px;
        }
        #game-topics {
            margin-top: 20px;
            background-color: #2e2e2e;
            padding: 10px;
            border-radius: 10px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
        }
        .designed-by {
            position: absolute;
            bottom: 10px;
            right: 10px;
            font-size: 14px;
            color: #ffffff;
        }
        .designed-by a {
            color: #FFD700;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div id="start-screen">
        <h1>成語貪吃蛇遊戲</h1>
        <button id="start-button">開始</button>
    </div>

    <div id="game-screen">
        <div id="info-text"></div>
        <div id="timer">遊戲時間: <span id="time-elapsed">0</span> 秒</div>
        <div id="eaten-words">
            <h2>已吃到的文字</h2>
            <div id="eaten-content"></div>
        </div>
        <canvas id="game-canvas" width="600" height="600"></canvas>
        <div class="controls">
            <div class="control-row">
                <div class="control-button" id="up">↑</div>
            </div>
            <div class="control-row">
                <div class="control-button" id="left">←</div>
                <div class="control-button" id="down">↓</div>
                <div class="control-button" id="right">→</div>
            </div>
        </div>
    </div>

    <div id="game-over">
        <div id="result-text"></div>
        <button id="restart-button">重新開始</button>
    </div>

    <div class="designed-by">
        Designed by <a href="https://kentxchang.blogspot.tw" target="_blank">阿剛老師</a>
    </div>

    <script>
        const startButton = document.getElementById('start-button');
        const gameScreen = document.getElementById('game-screen');
        const startScreen = document.getElementById('start-screen');
        const gameCanvas = document.getElementById('game-canvas');
        const gameOverScreen = document.getElementById('game-over');
        const resultText = document.getElementById('result-text');
        const restartButton = document.getElementById('restart-button');
        const timerElement = document.getElementById('time-elapsed');
        const eatenWordsElement = document.getElementById('eaten-content');
        const infoTextElement = document.getElementById('info-text');
        const ctx = gameCanvas.getContext('2d');

        let snake = [{x: 10, y: 10}];
        let direction = {x: 0, y: 0};
        let food = [];
        let gameInterval;
        let foodCount = 0;
        let gameOver = false;
        let textGroups = [];
        let currentGroup = [];
        let currentCharIndex = 0;
        let timeElapsed = 0;
        let eatenWords = [];
        let infoText = "";
        let remainingFood = [];
        let startTime;

        function setDirection(x, y) {
            if (!gameOver) {
                direction = {x, y};
            }
        }

        function startGame() {
            resetGame();
            gameScreen.style.display = 'flex';
            startTime = Date.now();
            gameInterval = setInterval(gameLoop, 100);
            countdown();
            chooseRandomGroup();
            placeRemainingFood();
        }

        function resetGame() {
            clearInterval(gameInterval);
            snake = [{x: 10, y: 10}];
            direction = {x: 0, y: 0};
            currentGroup = [];
            currentCharIndex = 0;
            foodCount = 0;
            timeElapsed = 0;
            eatenWords = [];
            infoText = "";
            infoTextElement.innerHTML = "";
            eatenWordsElement.innerHTML = '';
            timerElement.textContent = timeElapsed;
            gameOver = false;
            remainingFood = [];
            textGroups = \`${inputTextValue}\`.split('\\n').map(line => {
                const parts = line.split(/,|\\t/);
                return { words: parts[0].trim().split(''), info: parts[1] ? parts[1].trim() : '' };
            });
        }

        function chooseRandomGroup() {
            if (textGroups.length > 0) {
                const randomIndex = Math.floor(Math.random() * textGroups.length);
                currentGroup = textGroups[randomIndex].words;
                infoText = textGroups[randomIndex].info;
                infoTextElement.innerHTML = infoText;
                textGroups.splice(randomIndex, 1);
                placeFood();
            } else {
                currentGroup = [];
                endGame();
            }
        }

        function placeFood() {
            food = currentGroup.map(char => ({
                x: Math.floor(Math.random() * 15),
                y: Math.floor(Math.random() * 15),
                char
            }));
        }

        function placeRemainingFood() {
            remainingFood = textGroups.flatMap(group => group.words.map(char => ({
                x: Math.floor(Math.random() * 15),
                y: Math.floor(Math.random() * 15),
                char
            })));
        }

        function gameLoop() {
            if (currentGroup.length === 0) return;

            update();
            draw();
        }

        function update() {
            const head = {x: snake[0].x + direction.x, y: snake[0].y + direction.y};

            if (head.x < 0) head.x = 14;
            if (head.x >= 15) head.x = 0;
            if (head.y < 0) head.y = 14;
            if (head.y >= 15) head.y = 0;

            snake.unshift(head);

            const currentFood = food[currentCharIndex];
            if (head.x === currentFood.x && head.y === currentFood.y) {
                if (currentFood.char === currentGroup[currentCharIndex]) {
                    eatenWords.push(currentFood.char);
                    eatenWordsElement.innerHTML = eatenWords.join('');
                    currentCharIndex++;
                    if (currentCharIndex === currentGroup.length) {
                        currentCharIndex = 0;
                        chooseRandomGroup();
                        eatenWords.push('<br>');
                        placeRemainingFood();
                    }
                    foodCount++;
                    placeFood();
                } else {
                    resetCurrentGroup();
                }
            } else {
                snake.pop();
            }
        }

        function resetCurrentGroup() {
            currentCharIndex = 0;
            placeFood();
        }

        function draw() {
            ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);

            ctx.fillStyle = 'green';
            snake.forEach(segment => ctx.fillRect(segment.x * 40, segment.y * 40, 40, 40));

            ctx.fillStyle = 'red';
            ctx.font = 'bold 40px Arial';
            remainingFood.forEach(item => {
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(item.x * 40, item.y * 40, 40, 40);
                ctx.fillStyle = 'red';
                ctx.fillText(item.char, item.x * 40, item.y * 40 + 40);
            });
            food.forEach(item => {
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(item.x * 40, item.y * 40, 40, 40);
                ctx.fillStyle = 'red';
                ctx.fillText(item.char, item.x * 40, item.y * 40 + 40);
            });
        }

        function countdown() {
            const countdownInterval = setInterval(() => {
                if (gameOver) {
                    clearInterval(countdownInterval);
                } else {
                    timeElapsed = Math.floor((Date.now() - startTime) / 1000);
                    timerElement.textContent = timeElapsed;
                }
            }, 1000);
        }

        function endGame() {
            clearInterval(gameInterval);
            gameOver = true;
            const totalTime = Math.floor((Date.now() - startTime) / 1000);
            const formattedWords = eatenWords.join('').split('<br>').map(line => line.trim()).filter(line => line !== '');
            const linkedWords = formattedWords.map(word => \`<a href="https://pedia.cloud.edu.tw/Entry/Detail?title=\${encodeURIComponent(word)}" target="_blank">\${word}</a>\`).join('<br>');
            resultText.innerHTML = \`總遊戲時間:<br><span class="result-time">\${totalTime} 秒</span><br>內容:<br>\${linkedWords}\`;
            gameOverScreen.style.display = 'flex';
        }

        startButton.addEventListener('click', () => {
            startScreen.style.display = 'none';
            gameScreen.style.display = 'flex';
            startGame();
        });

        restartButton.addEventListener('click', () => {
            gameOverScreen.style.display = 'none';
            resetGame();
            startGame();
        });

        document.getElementById('up').addEventListener('click', () => setDirection(0, -1));
        document.getElementById('down').addEventListener('click', () => setDirection(0, 1));
        document.getElementById('left').addEventListener('click', () => setDirection(-1, 0));
        document.getElementById('right').addEventListener('click', () => setDirection(1, 0));

        document.addEventListener('keydown', (event) => {
            if (event.key === 'ArrowUp') setDirection(0, -1);
            if (event.key === 'ArrowDown') setDirection(0, 1);
            if (event.key === 'ArrowLeft') setDirection(-1, 0);
            if (event.key === 'ArrowRight') setDirection(1, 0);
            if (event.key === 'r' || event.key === 'R') {
                if (gameScreen.style.display === 'flex') {
                    gameScreen.style.display = 'none';
                    startScreen.style.display = 'flex';
                } else if (gameOverScreen.style.display === 'flex') {
                    gameOverScreen.style.display = 'none';
                    startScreen.style.display = 'flex';
                }
            }
        });
    </script>
</body>
</html>`;
}

function downloadFile(filename, content) {
    const element = document.createElement('a');
    const blob = new Blob([content], {type: 'text/plain'});
    const url = URL.createObjectURL(blob);
    element.setAttribute('href', url);
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    URL.revokeObjectURL(url);
}
