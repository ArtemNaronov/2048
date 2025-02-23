export const initBoard = () => {
  let board = Array(16)
    .fill(null)
    .map((_, index) => ({ value: 0, x: index % 4, y: Math.floor(index / 4) }));
  addRandomTile(board);
  addRandomTile(board);
  return board;
};

const addRandomTile = (board) => {
  let emptyTiles = board.filter((tile) => tile.value === 0);
  if (emptyTiles.length > 0) {
    let randomTile = emptyTiles[Math.floor(Math.random() * emptyTiles.length)];
    randomTile.value = Math.random() < 0.9 ? 2 : 4;
  }
};

const isGameOver = (board) => {
  return !board.some((tile) => tile.value === 0) && !hasMoveLeft(board);
};

const hasMoveLeft = (board) => {
  for (let i = 0; i < 16; i++) {
    let tile = board[i];
    let right = board[i + 1]?.value === tile.value;
    let down = board[i + 4]?.value === tile.value;

    if (right || down) return true;
  }
  return false;
};

export const moveTiles = (board, direction) => {
  let newBoard = board.map((tile, index) => ({
    value: tile.value,
    x: index % 4,
    y: Math.floor(index / 4),
    merged: false,
  }));

  let score = 0;

  const getRow = (r) => newBoard.slice(r * 4, r * 4 + 4);
  const setRow = (r, newRow) =>
    newRow.forEach((tile, i) => {
      newBoard[r * 4 + i] = tile;
      tile.x = i;
      tile.y = r;
    });

  const mergeRow = (row) => {
    let filtered = row.filter((tile) => tile.value !== 0);
    let newRow = [];

    for (let i = 0; i < filtered.length; i++) {
      if (
        i < filtered.length - 1 &&
        filtered[i].value === filtered[i + 1].value
      ) {
        let mergedValue = filtered[i].value * 2;
        score += mergedValue;
        newRow.push({
          value: mergedValue,
          x: filtered[i].x,
          y: filtered[i].y,
          merged: true,
        });
        i++;
      } else {
        newRow.push(filtered[i]);
      }
    }

    while (newRow.length < 4)
      newRow.push({ value: 0, x: 0, y: 0, merged: false });
    return newRow;
  };

  if (direction === "ArrowLeft") {
    for (let r = 0; r < 4; r++) {
      setRow(r, mergeRow(getRow(r)));
    }
  } else if (direction === "ArrowRight") {
    for (let r = 0; r < 4; r++) {
      setRow(r, mergeRow(getRow(r).reverse()).reverse());
    }
  } else if (direction === "ArrowUp") {
    for (let c = 0; c < 4; c++) {
      let col = [
        newBoard[c],
        newBoard[c + 4],
        newBoard[c + 8],
        newBoard[c + 12],
      ];
      let newCol = mergeRow(col);
      for (let i = 0; i < 4; i++) {
        newBoard[c + i * 4] = newCol[i];
        newCol[i].x = c;
        newCol[i].y = i;
      }
    }
  } else if (direction === "ArrowDown") {
    for (let c = 0; c < 4; c++) {
      let col = [
        newBoard[c],
        newBoard[c + 4],
        newBoard[c + 8],
        newBoard[c + 12],
      ];
      let newCol = mergeRow(col.reverse()).reverse();
      for (let i = 0; i < 4; i++) {
        newBoard[c + i * 4] = newCol[i];
        newBoard[c + i * 4].x = c;
        newBoard[c + i * 4].y = i;
      }
    }
  }

  if (JSON.stringify(board) !== JSON.stringify(newBoard)) {
    addRandomTile(newBoard);
  }

  if (isGameOver(newBoard)) {
    alert("Game over!");
  }

  return { board: newBoard, score };
};

let xDown = null;
let yDown = null;

export function handleTouchStart(evt) {
  xDown = evt.touches[0].clientX;
  yDown = evt.touches[0].clientY;
}

export function handleTouchMove(evt) {
  if (!xDown || !yDown) return;

  let xUp = evt.touches[0].clientX;
  let yUp = evt.touches[0].clientY;

  let xDiff = xDown - xUp;
  let yDiff = yDown - yUp;

  if (Math.abs(xDiff) > Math.abs(yDiff)) {
    moveTiles(xDiff > 0 ? "ArrowLeft" : "ArrowRight");
  } else {
    moveTiles(yDiff > 0 ? "ArrowUp" : "ArrowDown");
  }

  xDown = null;
  yDown = null;
}
