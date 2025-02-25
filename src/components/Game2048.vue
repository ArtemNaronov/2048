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
        :style="tileStyles[tile.x]?.[tile.y]"
      >
        {{ tile.value !== 0 ? tile.value : "" }}
      </div>
    </div>
    <div class="board__btns">
      <button @click="startGame" class="board-restart">Перезапуск</button>
      <button @click="undoLastMove" class="undo-button">Отменить</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from "vue";
import { initBoard, moveTiles, undoMove } from "../utils/game";

// Определение интерфейса плитки
interface Tile {
  value: number;
  x: number;
  y: number;
}

// Определение типа доски
type Board = Tile[];

const board = ref<Board>([]);
const score = ref<number>(0);
const boardRef = ref<HTMLDivElement | null>(null);

let touchStartX = 0, touchStartY = 0;
let mouseStartX = 0, mouseStartY = 0;

// Запуск новой игры
const startGame = (): void => {
  board.value = initBoard();
  score.value = 0;
};

// Обработка движения плиток
const handleMove = (direction: "ArrowLeft" | "ArrowRight" | "ArrowUp" | "ArrowDown"): void => {
  const { board: newBoard, score: newScore } = moveTiles(board.value, direction, score.value);
  board.value = newBoard;
  score.value += newScore;
};

// Обработчик событий клавиатуры
const handleKeyDown = (event: KeyboardEvent): void => {
  const validKeys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"] as const;
  if (validKeys.includes(event.key as any)) {
    handleMove(event.key as "ArrowLeft" | "ArrowRight" | "ArrowUp" | "ArrowDown");
  }
};

// Обработчик движения пальца (отключаем прокрутку)
const handleTouchMove = (event: TouchEvent): void => {
  event.preventDefault(); // Отключаем прокрутку страницы
};

// Обработчик начала касания (мобильные устройства)
const handleTouchStart = (event: TouchEvent): void => {
  event.preventDefault(); 
  touchStartX = event.touches[0].clientX;
  touchStartY = event.touches[0].clientY;
};

// Обработчик окончания касания
const handleTouchEnd = (event: TouchEvent): void => {
  event.preventDefault(); // Отключаем стандартное поведение
  const touchEndX = event.changedTouches[0].clientX;
  const touchEndY = event.changedTouches[0].clientY;
  detectSwipe(touchStartX, touchStartY, touchEndX, touchEndY);
};

// Обработчик начала нажатия мыши
const handleMouseDown = (event: MouseEvent): void => {
  mouseStartX = event.clientX;
  mouseStartY = event.clientY;
};

// Обработчик окончания нажатия мыши
const handleMouseUp = (event: MouseEvent): void => {
  const mouseEndX = event.clientX;
  const mouseEndY = event.clientY;
  detectSwipe(mouseStartX, mouseStartY, mouseEndX, mouseEndY);
};

// Определение направления свайпа
const detectSwipe = (startX: number, startY: number, endX: number, endY: number): void => {
  const diffX = startX - endX;
  const diffY = startY - endY;
  
  if(Math.abs(diffY) > 10 || Math.abs(diffX) > 10) {
    if (Math.abs(diffX) > Math.abs(diffY)) {
      handleMove(diffX > 0 ? "ArrowLeft" : "ArrowRight");
    } else {
      handleMove(diffY > 0 ? "ArrowUp" : "ArrowDown");
    }
  }
};

// Вычисляем стили для плиток
const tileStyles = computed<Record<number, Record<number, { transform: string }>>>(() =>
  board.value.reduce((acc, tile) => {
    acc[tile.x] = acc[tile.x] || {};
    acc[tile.x][tile.y] = {
      transform: `translate(${tile.x * 90}px, ${tile.y * 90}px)`
    };
    return acc;
  }, {} as Record<number, Record<number, { transform: string }>>)
);

onMounted(() => {
  startGame();
  document.addEventListener("touchstart", handleTouchStart, { passive: false });
  document.addEventListener("touchmove", handleTouchMove, { passive: false });
  document.addEventListener("touchend", handleTouchEnd, { passive: false });
});

onBeforeUnmount(() => {
  document.removeEventListener("touchstart", handleTouchStart);
  document.removeEventListener("touchmove", handleTouchMove);
  document.removeEventListener("touchend", handleTouchEnd);
});

const undoLastMove = (): void => {
  const previousState = undoMove();
  if (previousState) {
    board.value = previousState.board;
    score.value = previousState.score;
  }
};
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
  justify-content: center;
}

.score-board {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 20px;
  color: #776e65;
}

.board {
  position: relative;
  width: 390px;
  height: 390px;
  background: #bbada0;
  border-radius: 10px;
  margin-bottom: 20px;
  padding: 20px;
}

.board__btns {
  display: flex;
  gap: 10px;
}

.board-restart {
  background-color: #f67c5f;
}

h1 {
  color: #f67c5f;
}

.tile {
  position: absolute;
  width: 80px;
  height: 80px;
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

.undo-button {
  background-color: #8f7a66; /* Коричневый цвет в стиле 2048 */
  color: #fff;
  border: none;
  padding: 12px 20px;
  font-size: 18px;
  font-weight: bold;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.2);
}

.undo-button:hover {
  background-color: #a58d7f; /* Светлее при наведении */
}

.undo-button:active {
  transform: scale(0.95); /* Небольшой эффект нажатия */
}

.undo-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
  box-shadow: none;
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
