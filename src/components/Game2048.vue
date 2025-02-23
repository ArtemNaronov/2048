<template>
  <div class="game-container" @mousedown="handleMouseDown" @mouseup="handleMouseUp">
    <h1>2048</h1>
    <div class="score-board">
      <p>Счёт: {{ score }}</p>
    </div>
    <div class="board" ref="boardRef">
      <div
        v-for="tile in board"
        :key="`${tile.x}-${tile.y}`"
        class="tile"
        :class="'tile-' + tile.value"
        :style="tileStyles[tile.x][tile.y]"
      >
        {{ tile.value !== 0 ? tile.value : "" }}
      </div>
    </div>
    <button @click="startGame" class="board-restart">Перезапуск</button>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from "vue";
import {
  initBoard,
  moveTiles,
} from "../utils/game.js";

const board = ref([]);
const score = ref(0);
const boardRef = ref(null);
let touchStartX = 0, touchStartY = 0;
let mouseStartX = 0, mouseStartY = 0;

const startGame = () => {
  board.value = initBoard();
  score.value = 0;
};

const handleMove = (direction) => {
  const { board: newBoard, score: newScore } = moveTiles(board.value, direction);
  board.value = newBoard;
  score.value += newScore;
};

// Обработчики для клавиатуры
const handleKeyDown = (event) => {
  const validKeys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"];
  if (validKeys.includes(event.key)) {
    handleMove(event.key);
  }
};

// Обработчики для мобильных свайпов
const handleTouchStart = (event) => {
  touchStartX = event.touches[0].clientX;
  touchStartY = event.touches[0].clientY;
};

const handleTouchEnd = (event) => {
  const touchEndX = event.changedTouches[0].clientX;
  const touchEndY = event.changedTouches[0].clientY;
  detectSwipe(touchStartX, touchStartY, touchEndX, touchEndY);
};

// Обработчики для мыши
const handleMouseDown = (event) => {
  mouseStartX = event.clientX;
  mouseStartY = event.clientY;
};

const handleMouseUp = (event) => {
  const mouseEndX = event.clientX;
  const mouseEndY = event.clientY;
  detectSwipe(mouseStartX, mouseStartY, mouseEndX, mouseEndY);
};

// Определение направления свайпа
const detectSwipe = (startX, startY, endX, endY) => {
  const diffX = startX - endX;
  const diffY = startY - endY;
  if (Math.abs(diffX) > Math.abs(diffY)) {
    handleMove(diffX > 0 ? "ArrowLeft" : "ArrowRight");
  } else {
    handleMove(diffY > 0 ? "ArrowUp" : "ArrowDown");
  }
};

// Вычисляем стили для плиток
const tileStyles = computed(() =>
  board.value.reduce((acc, tile) => {
    acc[tile.x] = acc[tile.x] || [];
    acc[tile.x][tile.y] = {
      transform: `translate(${tile.x * 110}px, ${tile.y * 110}px)`,
      transition: "transform 0.2s ease-in-out",
    };
    return acc;
  }, [])
);

onMounted(() => {
  startGame();
  window.addEventListener("keydown", handleKeyDown);
  document.addEventListener("touchstart", handleTouchStart, false);
  document.addEventListener("touchend", handleTouchEnd, false);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleKeyDown);
  document.removeEventListener("touchstart", handleTouchStart);
  document.removeEventListener("touchend", handleTouchEnd);
});
</script>

<style scoped>
.game-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100vh;
  width: 100vw;
  background: #faf8ef;
  padding-top: 20px;
}

.score-board {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 20px;
  color: #776e65;
}

.board {
  position: relative;
  width: 470px;
  height: 470px;
  background: #bbada0;
  border-radius: 10px;
  margin-bottom: 20px;
  padding: 20px;
}

h1 {
  color: #f67c5f;
}

.tile {
  position: absolute;
  width: 100px;
  height: 100px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 24px;
  font-weight: bold;
  color: #776e65;
  background: #cdc1b4;
  border-radius: 5px;
  transition: transform 0.2s ease-in-out;
  user-select: none;
}

.tile-2 {
  background: #eee4da;
}
.tile-4 {
  background: #ede0c8;
}
.tile-8 {
  background: #f2b179;
  color: #f9f6f2;
}
.tile-16 {
  background: #f59563;
  color: #f9f6f2;
}
.tile-32 {
  background: #f67c5f;
  color: #f9f6f2;
}
.tile-64 {
  background: #f65e3b;
  color: #f9f6f2;
}
.tile-128 {
  background: #edcf72;
  color: #f9f6f2;
}
.tile-256 {
  background: #edcc61;
  color: #f9f6f2;
}
.tile-512 {
  background: #edc850;
  color: #f9f6f2;
}
.tile-1024 {
  background: #edc53f;
  color: #f9f6f2;
}
.tile-2048 {
  background: #edc22e;
  color: #f9f6f2;
}
</style>
