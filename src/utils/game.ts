export const initBoard = () => {
  const board = Array.from({ length: 16 }, (_, index) => ({
    value: 0,
    x: index % 4,
    y: Math.floor(index / 4),
  }));

  addRandomTile(board);
  addRandomTile(board);

  return board;
};

const addRandomTile = (board) => {
  const emptyTiles = board.filter((tile) => tile.value === 0);
  if (emptyTiles.length > 0) {
    const randomTile = emptyTiles[Math.floor(Math.random() * emptyTiles.length)];
    randomTile.value = Math.random() < 0.9 ? 2 : 4;
  }
};

const isGameOver = (board) => !board.some((tile) => tile.value === 0) && !hasMoveLeft(board);

const hasMoveLeft = (board) => {
  for (let i = 0; i < 16; i++) {
    const tile = board[i];
    if (
      board[i + 1]?.value === tile.value || 
      board[i + 4]?.value === tile.value
    ) return true;
  }
  return false;
};

export const moveTiles = (board, direction) => {
  let newBoard = board.map((tile, index) => ({
    ...tile,
    x: index % 4,
    y: Math.floor(index / 4),
    merged: false,
  }));

  let score = 0;

  const getRow = (r) => newBoard.slice(r * 4, r * 4 + 4);
  const setRow = (r, newRow) => {
    newRow.forEach((tile, i) => {
      newBoard[r * 4 + i] = tile;
      tile.x = i;
      tile.y = r;
    });
  };

  const mergeRow = (row) => {
    const filtered = row.filter((tile) => tile.value !== 0);
    const newRow = [];

    for (let i = 0; i < filtered.length; i++) {
      if (i < filtered.length - 1 && filtered[i].value === filtered[i + 1].value) {
        const mergedValue = filtered[i].value * 2;
        score += mergedValue;
        newRow.push({ value: mergedValue, x: filtered[i].x, y: filtered[i].y, merged: true });
        i++;
      } else {
        newRow.push(filtered[i]);
      }
    }

    while (newRow.length < 4) newRow.push({ value: 0, x: 0, y: 0, merged: false });
    return newRow;
  };

  const moveAndMerge = (getter, setter, reverse = false) => {
    for (let i = 0; i < 4; i++) {
      let row = getter(i);
      if (reverse) row = row.reverse();
      let newRow = mergeRow(row);
      if (reverse) newRow = newRow.reverse();
      setter(i, newRow);
    }
  };

  if (direction === "ArrowLeft") moveAndMerge(getRow, setRow);
  if (direction === "ArrowRight") moveAndMerge(getRow, setRow, true);
  if (direction === "ArrowUp") moveAndMerge((c) => [newBoard[c], newBoard[c + 4], newBoard[c + 8], newBoard[c + 12]], 
                                            (c, newCol) => newCol.forEach((tile, i) => { newBoard[c + i * 4] = tile; tile.x = c; tile.y = i; }));
  if (direction === "ArrowDown") moveAndMerge((c) => [newBoard[c + 12], newBoard[c + 8], newBoard[c + 4], newBoard[c]], 
                                              (c, newCol) => newCol.reverse().forEach((tile, i) => { newBoard[c + i * 4] = tile; tile.x = c; tile.y = i; }));

  if (JSON.stringify(board) !== JSON.stringify(newBoard)) addRandomTile(newBoard);

  if (isGameOver(newBoard)) alert("Game over!");

  return { board: newBoard, score };
};

// Управление свайпами
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

  moveTiles(xDiff > 0 ? "ArrowLeft" : "ArrowRight");
  moveTiles(yDiff > 0 ? "ArrowUp" : "ArrowDown");

  xDown = null;
  yDown = null;
}
