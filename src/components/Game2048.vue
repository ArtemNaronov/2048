<template>
  <div class="game-container" :class="theme" @mousedown="handleMouseDown" @mouseup="handleMouseUp">
    <h1>2048</h1>
    <div class="score-board">
      <p>Счёт: {{ score }}</p>
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

document.addEventListener("touchmove", (event) => {
  event.preventDefault();
}, { passive: false });

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

const theme = ref('classic')

onMounted(() => {
  if(localStorage.getItem('theme')) {
    theme.value = localStorage.getItem('theme')
  }
  
  startGame();
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


const show = ref<Boolean>(false)
const showModal = (): void => {
  show.value = !show.value
}
const changeTheme = (newTheme): void => {
  theme.value = newTheme
}
</script>

<style scoped lang="scss">
$color-bg: #F8E8F8;
$color-board: #8e5aaf;
$color-tile: #E0B0FF;
$color-text: #4A235A;
$color-restart: #E6A8FF;
$color-title: #A24587;
$color-button: #B076C9;
$color-button-hover: #A24587;

$tile-colors: (
  2: (#FAD2E1, #4A235A),
  4: (#E8A2DC, #4A235A),
  8: (#D48AC1, #f9f6f2),
  16: (#C774B0, #f9f6f2),
  32: (#B35A9B, #f9f6f2),
  64: (#A24587, #f9f6f2),
  128: (#902F74, #f9f6f2),
  256: (#7E1D62, #f9f6f2),
  512: (#6D0B51, #f9f6f2),
  1024: (#5B003F, #f9f6f2),
  2048: (#48002D, #f9f6f2)
);

$color-bg-blue: #E0F1FF;
$color-board-blue: #2E3C87;
$color-tile-blue: #A0C4FF;
$color-text-blue: #003F88;
$color-restart-blue: #A1C6EA;
$color-title-blue: #003F88;
$color-button-blue: #669BBC;
$color-button-hover-blue: #4A86D9;

$tile-colors-blue: (
  2: (#D0E4F1, #003F88),
  4: (#A1C6EA, #003F88),
  8: (#7FA0D7, #f9f6f2),
  16: (#6788C2, #f9f6f2),
  32: (#5671A6, #f9f6f2),
  64: (#4A86D9, #f9f6f2),
  128: (#3B63A1, #f9f6f2),
  256: (#2E3C87, #f9f6f2),
  512: (#1F3170, #f9f6f2),
  1024: (#14224F, #f9f6f2),
  2048: (#0F173B, #f9f6f2)
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
      background: linear-gradient(-45deg, #E0B0FF, #D48AC1, #A24587, #E0B0FF);
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
      background: linear-gradient(-45deg, $color-bg-blue, $color-board-blue, $color-tile-blue, $color-bg-blue);
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
