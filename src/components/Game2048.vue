<template>
  <div class="game-container">
    <h1>2048</h1>
    <div class="score-board">
      <p>Счёт: {{ score }}</p>
    </div>
    <div class="board">
      <div
        v-for="tile in board"
        :key="`${tile.x}-${tile.y}`"
        class="tile"
        :class="'tile-' + tile.value"
        :style="getTileStyle(tile)"
      >
        {{ tile.value !== 0 ? tile.value : "" }}
      </div>
    </div>
    <button @click="startGame" class="board-restart">Перезапуск</button>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import {
  initBoard,
  moveTiles,
  handleTouchStart,
  handleTouchMove,
} from "../utils/game.js";

const board = ref([]);
const score = ref(0);

const startGame = () => {
  board.value = initBoard();
  score.value = 0;
};

const handleMove = (event) => {
  const validKeys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"];
  if (!validKeys.includes(event.key)) return;

  let { board: newBoard, score: newScore } = moveTiles(board.value, event.key);
  board.value = newBoard;
  score.value += newScore;
};

const getTileStyle = (tile) => ({
  transform: `translate(${tile.x * 110}px, ${tile.y * 110}px)`,
  transition: "transform 0.2s ease-in-out",
});

onMounted(() => {
  startGame();
  window.addEventListener("keydown", handleMove);
  document.addEventListener("touchstart", handleTouchStart, false);
  document.addEventListener("touchmove", handleTouchMove, false);
});
</script>

<style scoped>
.game-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100svh;
  width: 100svw;
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
  width: 430px;
  height: 430px;
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
