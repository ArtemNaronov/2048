<template>
  <div
    class="game-container"
    :class="theme"
    @mousedown="handleMouseDown"
    @mouseup="handleMouseUp"
  >
    <h1>2048</h1>
    <div class="score-board">
      <p>Счёт: {{ score }}</p>
      <p>Лучший счёт: {{ best_score }}</p>
    </div>
    <button class="board-setting" @click="showModal">
      <Setting />
    </button>
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

    <Modal :show="show" @close="showModal" @changeTheme="changeTheme" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from "vue";
import { initBoard, moveTiles, undoMove } from "../utils/game";
import Setting from "./Setting.vue";
import Modal from "./Modal.vue";

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
const best_score = ref<number>(0);
const boardRef = ref<HTMLDivElement | null>(null);

let touchStartX = 0,
  touchStartY = 0;
let mouseStartX = 0,
  mouseStartY = 0;

// Запуск новой игры
const startGame = (): void => {
  board.value = initBoard();
  score.value = 0;
};

// Обработка движения плиток
const handleMove = (
  direction: "ArrowLeft" | "ArrowRight" | "ArrowUp" | "ArrowDown"
): void => {
  const { board: newBoard, score: newScore } = moveTiles(
    board.value,
    direction,
    score.value
  );
  board.value = newBoard;
  score.value += newScore;

  if (score.value > best_score.value) {
    console.log("kjh");

    best_score.value = score.value;
    localStorage.setItem("best_score", String(best_score.value));
  }

  localStorage.setItem("board", JSON.stringify(board.value));
  localStorage.setItem("score", String(score.value));
};

// Обработчик событий клавиатуры
const handleKeyDown = (event: KeyboardEvent): void => {
  const validKeys = [
    "ArrowLeft",
    "ArrowRight",
    "ArrowUp",
    "ArrowDown",
  ] as const;
  if (validKeys.includes(event.key as any)) {
    handleMove(
      event.key as "ArrowLeft" | "ArrowRight" | "ArrowUp" | "ArrowDown"
    );
  }
};

// Обработчик движения пальца (отключаем прокрутку)
const handleTouchMove = (event: TouchEvent): void => {
  event.preventDefault(); // Отключаем прокрутку страницы
};

// Обработчик начала касания (мобильные устройства)
const handleTouchStart = (event: TouchEvent): void => {
  if ((event.target as HTMLElement).closest("button")) return;
  event.preventDefault();
  touchStartX = event.touches[0].clientX;
  touchStartY = event.touches[0].clientY;
};

// Обработчик окончания касания
const handleTouchEnd = (event: TouchEvent): void => {
  if ((event.target as HTMLElement).closest("button")) return;
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
const detectSwipe = (
  startX: number,
  startY: number,
  endX: number,
  endY: number
): void => {
  const diffX = startX - endX;
  const diffY = startY - endY;

  if (Math.abs(diffY) > 10 || Math.abs(diffX) > 10) {
    if (Math.abs(diffX) > Math.abs(diffY)) {
      handleMove(diffX > 0 ? "ArrowLeft" : "ArrowRight");
    } else {
      handleMove(diffY > 0 ? "ArrowUp" : "ArrowDown");
    }
  }
};

document.addEventListener(
  "touchmove",
  (event) => {
    event.preventDefault();
  },
  { passive: false }
);

// Вычисляем стили для плиток
const tileStyles = computed<
  Record<number, Record<number, { transform: string }>>
>(() =>
  board.value.reduce((acc, tile) => {
    acc[tile.x] = acc[tile.x] || {};
    acc[tile.x][tile.y] = {
      transform: `translate(${tile.x * 90}px, ${tile.y * 90}px)`,
    };
    return acc;
  }, {} as Record<number, Record<number, { transform: string }>>)
);

const theme = ref("classic");

onMounted(() => {
  startGame();

  if (localStorage.getItem("theme")) {
    theme.value = localStorage.getItem("theme");
  }
  if (localStorage.getItem("board")) {
    board.value = JSON.parse(localStorage.getItem("board"));
  }
  score.value = parseInt(localStorage.getItem("score")) || 0;
  best_score.value = parseInt(localStorage.getItem("best_score")) || 0;

  document.addEventListener("keydown", handleKeyDown);
  document.addEventListener("touchstart", handleTouchStart, { passive: false });
  document.addEventListener("touchmove", handleTouchMove, { passive: false });
  document.addEventListener("touchend", handleTouchEnd, { passive: false });
});

onBeforeUnmount(() => {
  document.removeEventListener("keydown", handleKeyDown);
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

const show = ref<Boolean>(false);
const showModal = (): void => {
  show.value = !show.value;
};
const changeTheme = (newTheme): void => {
  theme.value = newTheme;
};
</script>

<style scoped lang="scss">
$color-bg: #f8e8f8;
$color-board: #8e5aaf;
$color-tile: #e0b0ff;
$color-text: #4a235a;
$color-restart: #e6a8ff;
$color-title: #a24587;
$color-button: #b076c9;
$color-button-hover: #a24587;

$tile-colors: (
  2: (
    #fad2e1,
    #4a235a,
  ),
  4: (
    #e8a2dc,
    #4a235a,
  ),
  8: (
    #d48ac1,
    #f9f6f2,
  ),
  16: (
    #c774b0,
    #f9f6f2,
  ),
  32: (
    #b35a9b,
    #f9f6f2,
  ),
  64: (
    #a24587,
    #f9f6f2,
  ),
  128: (
    #902f74,
    #f9f6f2,
  ),
  256: (
    #7e1d62,
    #f9f6f2,
  ),
  512: (
    #6d0b51,
    #f9f6f2,
  ),
  1024: (
    #5b003f,
    #f9f6f2,
  ),
  2048: (
    #48002d,
    #f9f6f2,
  ),
);

$color-bg-blue: #e0f1ff;
$color-board-blue: #2e3c87;
$color-tile-blue: #a0c4ff;
$color-text-blue: #003f88;
$color-restart-blue: #a1c6ea;
$color-title-blue: #003f88;
$color-button-blue: #669bbc;
$color-button-hover-blue: #4a86d9;

$tile-colors-blue: (
  2: (
    #d0e4f1,
    #003f88,
  ),
  4: (
    #a1c6ea,
    #003f88,
  ),
  8: (
    #7fa0d7,
    #f9f6f2,
  ),
  16: (
    #6788c2,
    #f9f6f2,
  ),
  32: (
    #5671a6,
    #f9f6f2,
  ),
  64: (
    #4a86d9,
    #f9f6f2,
  ),
  128: (
    #3b63a1,
    #f9f6f2,
  ),
  256: (
    #2e3c87,
    #f9f6f2,
  ),
  512: (
    #1f3170,
    #f9f6f2,
  ),
  1024: (
    #14224f,
    #f9f6f2,
  ),
  2048: (
    #0f173b,
    #f9f6f2,
  ),
);

.game-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100vh;
  width: 100vw;
  background: #faf8ef;
  padding-bottom: 60px;
  justify-content: center;

  &.design {
    &__pink {
      background: linear-gradient(-45deg, #e0b0ff, #d48ac1, #a24587, #e0b0ff);
      background-size: 400% 400%;
      animation: gradientAnimation 10s ease infinite;

      .score-board {
        color: $color-text;
      }

      .board {
        background: $color-board;
      }

      .board-restart {
        background-color: $color-restart;
      }

      h1 {
        color: $color-title;
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
      }

      .tile {
        color: $color-text;
        background: $color-tile;
      }

      @each $key, $values in $tile-colors {
        .tile-#{$key} {
          background: nth($values, 1);
          color: nth($values, 2);
        }
      }

      .undo-button {
        background-color: $color-button;
      }
      .undo-button:hover {
        background-color: $color-button-hover;
      }
    }
    &__blue {
      background: linear-gradient(
        -45deg,
        $color-bg-blue,
        $color-board-blue,
        $color-tile-blue,
        $color-bg-blue
      );
      background-size: 400% 400%;
      animation: gradientAnimation 10s ease infinite;

      .score-board {
        color: $color-text-blue;
      }

      .board {
        background: $color-board-blue;
      }

      .board-restart {
        background-color: $color-restart-blue;
      }

      h1 {
        color: $color-title-blue;
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
      }

      .tile {
        color: $color-text-blue;
        background: $color-tile-blue;
      }

      @each $key, $values in $tile-colors-blue {
        .tile-#{$key} {
          background: nth($values, 1);
          color: nth($values, 2);
        }
      }

      .undo-button {
        background-color: $color-button-blue;
      }
      .undo-button:hover {
        background-color: $color-button-hover-blue;
      }
    }
  }
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
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.2);
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

.board-setting {
  position: absolute;
  right: 10px;
  top: 10px;
  padding: 20px;
  background-color: transparent;
  border: none;
}

@keyframes gradientAnimation {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}
</style>
