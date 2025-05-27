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
      <p>Лучший счёт: {{ bestScore }}</p>
    </div>
    <button class="board-setting" @click="toggleModal" aria-label="Настройки">
      <Setting />
    </button>
    <div class="board" ref="boardRef">
      <div
        v-for="tile in board"
        :key="`${tile.x}-${tile.y}`"
        class="tile"
        :class="`tile-${tile.value}`"
        :style="getTileStyle(tile)"
      >
        {{ tile.value !== 0 ? tile.value : "" }}
      </div>
    </div>
    <div class="board__btns">
      <button @click="startGame" class="board-restart">Перезапуск</button>
      <button @click="undoLastMove" class="undo-button">Отменить</button>
    </div>

    <Modal :show="showModal" @close="toggleModal" @change-theme="changeTheme" />
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
const bestScore = ref<number>(0);
const boardRef = ref<HTMLDivElement | null>(null);
const showModal = ref<boolean>(false);
const theme = ref<string>("classic");

const touchStart = ref({ x: 0, y: 0 });
const mouseStart = ref({ x: 0, y: 0 });

const SWIPE_THRESHOLD = 10;
const VALID_KEYS = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"] as const;
type Direction = typeof VALID_KEYS[number];

const tileStyles = computed(() => {
  return board.value.reduce((acc, tile) => {
    if (!acc[tile.x]) acc[tile.x] = {};
    acc[tile.x][tile.y] = {
      transform: `translate(${tile.x * 90}px, ${tile.y * 90}px)`,
    };
    return acc;
  }, {} as Record<number, Record<number, { transform: string }>>);
});

// Запуск новой игры
const startGame = (): void => {
  board.value = initBoard();
  score.value = 0;
  saveGameState();
};

// Обработка движения плиток
const handleMove = (direction: Direction): void => {
  const { board: newBoard, score: newScore } = moveTiles(
    board.value,
    direction,
    score.value
  );
  board.value = newBoard;
  score.value += newScore;

  if (score.value > bestScore.value) {
    bestScore.value = score.value;
    localStorage.setItem("best_score", String(bestScore.value));
  }

  saveGameState();
};

// Обработчик событий клавиатуры
const handleKeyDown = (event: KeyboardEvent): void => {
  if (VALID_KEYS.includes(event.key as Direction)) {
    handleMove(event.key as Direction);
  }
};

// Обработчик начала касания 
const handleTouchStart = (event: TouchEvent): void => {
  if ((event.target as HTMLElement).closest("button")) return;
  event.preventDefault();
  touchStart.value = {
    x: event.touches[0].clientX,
    y: event.touches[0].clientY,
  };
};

// Обработчик окончания касания
const handleTouchEnd = (event: TouchEvent): void => {
  if ((event.target as HTMLElement).closest("button")) return;
  event.preventDefault();
  detectSwipe(
    touchStart.value.x,
    touchStart.value.y,
    event.changedTouches[0].clientX,
    event.changedTouches[0].clientY
  );
};

// Обработчик начала нажатия мыши
const handleMouseDown = (event: MouseEvent): void => {
  mouseStart.value = {
    x: event.clientX,
    y: event.clientY,
  };
};

// Обработчик окончания нажатия мыши
const handleMouseUp = (event: MouseEvent): void => {
  detectSwipe(
    mouseStart.value.x,
    mouseStart.value.y,
    event.clientX,
    event.clientY
  );
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

  if (Math.abs(diffY) > SWIPE_THRESHOLD || Math.abs(diffX) > SWIPE_THRESHOLD) {
    handleMove(
      Math.abs(diffX) > Math.abs(diffY)
        ? diffX > 0
          ? "ArrowLeft"
          : "ArrowRight"
        : diffY > 0
        ? "ArrowUp"
        : "ArrowDown"
    );
  }
};

const getTileStyle = (tile: Tile) => {
  return tileStyles.value[tile.x]?.[tile.y];
};

const saveGameState = (): void => {
  localStorage.setItem("board", JSON.stringify(board.value));
  localStorage.setItem("score", String(score.value));
};

const loadStoredData = <T>(key: string, defaultValue: T): T => {
  const storedValue = localStorage.getItem(key);
  return storedValue ? JSON.parse(storedValue) : defaultValue;
};

const undoLastMove = (): void => {
  const previousState = undoMove();
  if (previousState) {
    board.value = previousState.board;
    score.value = previousState.score;
    saveGameState();
  }
};

const toggleModal = (): void => {
  showModal.value = !showModal.value;
};
const changeTheme = (newTheme: string): void => {
  theme.value = newTheme;
  localStorage.setItem("theme", newTheme);
};

onMounted(() => {
  startGame();

  const storedTheme = localStorage.getItem("theme");
  if (storedTheme) theme.value = storedTheme;

  board.value = loadStoredData<Board>("board", []);
  score.value = loadStoredData<number>("score", 0);
  bestScore.value = loadStoredData<number>("best_score", 0);

  document.addEventListener("keydown", handleKeyDown);
  document.addEventListener("touchstart", handleTouchStart, { passive: false });
  document.addEventListener("touchmove", preventScroll, { passive: false });
  document.addEventListener("touchend", handleTouchEnd, { passive: false });
});

const preventScroll = (event: TouchEvent) => {
  event.preventDefault();
};

onBeforeUnmount(() => {
  document.removeEventListener("keydown", handleKeyDown);
  document.removeEventListener("touchstart", handleTouchStart);
  document.removeEventListener("touchmove", preventScroll);
  document.removeEventListener("touchend", handleTouchEnd);
});
</script>

<style scoped lang="scss">
$base-transition: all 0.2s ease-in-out;
$base-shadow: 2px 2px 5px rgba(0, 0, 0, 0.2);
$base-border-radius: 8px;

$classic-colors: (
  bg: #faf8ef,
  board: #bbada0,
  tile: #cdc1b4,
  text: #776e65,
  restart: #f67c5f,
  title: #776e65,
  button: #8f7a66,
  button-hover: #a58d7f,
);

// Pink theme
$pink-colors: (
  bg: linear-gradient(-45deg, #e0b0ff, #d48ac1, #a24587, #e0b0ff),
  board: #8e5aaf,
  tile: #e0b0ff,
  text: #4a235a,
  restart: #e6a8ff,
  title: #a24587,
  button: #b076c9,
  button-hover: #a24587,
);

// Blue theme
$blue-colors: (
  bg: linear-gradient(-45deg, #e0f1ff, #2e3c87, #a0c4ff, #e0f1ff),
  board: #2e3c87,
  tile: #a0c4ff,
  text: #003f88,
  restart: #a1c6ea,
  title: #003f88,
  button: #669bbc,
  button-hover: #4a86d9,
);


// Base styles
.game-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  width: 100vw;
  padding: 20px;
  box-sizing: border-box;
  background: map-get($classic-colors, bg);
  transition: $base-transition;

  &.design {
    &__pink {
      background: map-get($pink-colors, bg);
      background-size: 400% 400%;
      animation: gradientAnimation 10s ease infinite;

      .score-board {
        color: map-get($pink-colors, text);
      }

      .board {
        background: map-get($pink-colors, board);
      }

      .board-restart {
        background-color: map-get($pink-colors, restart);
      }

      h1 {
        color: map-get($pink-colors, title);
        text-shadow: $base-shadow;
      }

      // .tile {
      //   color: map-get($pink-colors, text);
      //   background: map-get($pink-colors, tile);
      // }

      .undo-button {
        background-color: map-get($pink-colors, button);
        
        &:hover {
          background-color: map-get($pink-colors, button-hover);
        }
      }
    }

    &__blue {
      background: map-get($blue-colors, bg);
      background-size: 400% 400%;
      animation: gradientAnimation 10s ease infinite;

      .score-board {
        color: map-get($blue-colors, text);
      }

      .board {
        background: map-get($blue-colors, board);
      }

      .board-restart {
        background-color: map-get($blue-colors, restart);
      }

      h1 {
        color: map-get($blue-colors, title);
        text-shadow: $base-shadow;
      }

      // .tile {
      //   color: map-get($blue-colors, text);
      //   background: map-get($blue-colors, tile);
      // }

      .undo-button {
        background-color: map-get($blue-colors, button);
        
        &:hover {
          background-color: map-get($blue-colors, button-hover);
        }
      }
    }
  }
}

.score-board {
  font-size: 1.5rem;
  font-weight: bold;
  margin: 1rem 0;
  color: map-get($classic-colors, text);
}

.board {
  position: relative;
  width: 390px;
  height: 390px;
  background: map-get($classic-colors, board);
  border-radius: $base-border-radius;
  margin: 1rem 0;
  padding: 20px;
  box-sizing: border-box;
}

.board__btns {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.board-restart,
.undo-button {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: bold;
  border: none;
  border-radius: $base-border-radius;
  cursor: pointer;
  transition: $base-transition;
  box-shadow: $base-shadow;
  color: white;

  &:active {
    transform: scale(0.95);
  }

  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
    box-shadow: none;
  }
}

.board-restart {
  background-color: map-get($classic-colors, restart);
}

h1 {
  font-size: 3rem;
  margin: 0.5rem 0;
  color: map-get($classic-colors, title);
}

.tile {
  position: absolute;
  width: 80px;
  height: 80px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1.5rem;
  font-weight: bold;
  color: map-get($classic-colors, text);
  background: map-get($classic-colors, tile);
  border-radius: 5px;
  transition: transform 0.2s ease-in-out;
  user-select: none;
}

.undo-button {
  background-color: map-get($classic-colors, button);
  
  &:hover {
    background-color: map-get($classic-colors, button-hover);
  }
}

.board-setting {
  position: absolute;
  right: 1rem;
  top: 1rem;
  padding: 1rem;
  background-color: transparent;
  border: none;
  cursor: pointer;
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

// Classic tile colors
@for $i from 1 through 17 {
  $value: pow(2, $i);
  .tile-#{$value} {
    $base-color: #eee4da;
    $target-color: #edc22e;
    $dark-color: #3c3a32;
    
    background: if($i <= 11, 
                 mix($base-color, $target-color, percentage(1 - ($i/11))),
                 $dark-color);
    color: if($i > 2, #f9f6f2, #776e65);
    
    @if $i >= 6 {
      box-shadow: 0 0 15px 5px rgba(0,0,0,0.1);
    }
  }
}
.design__pink {
  @for $i from 1 through 17 {
    $value: pow(2, $i);
    .tile-#{$value} {
      $base-color: #fad2e1;
      $target-color: #48002d;
      $dark-color: #120009;
      
      background: if($i <= 11,
                   mix($base-color, $target-color, percentage(1 - ($i/11))),
                   darken($dark-color, $i - 11));
      color: if($i > 1, #f9f6f2, #4a235a);
      
      @if $i >= 8 {
        text-shadow: 0 0 5px rgba(0,0,0,0.5);
      }
    }
  }
}

.design__blue {
  @for $i from 1 through 17 {
    $value: pow(2, $i);
    .tile-#{$value} {
      $base-color: #d0e4f1;
      $target-color: #0f173b;
      $dark-color: #040610;
      
      background: if($i <= 11,
                   mix($base-color, $target-color, percentage(1 - ($i/11))),
                   darken($dark-color, ($i - 11) * 5%));
      color: if($i > 1, #f9f6f2, #003f88);
      
      @if $i >= 7 {
        box-shadow: 0 0 10px 3px rgba(0,0,0,0.2);
      }
    }
  }
}
</style>