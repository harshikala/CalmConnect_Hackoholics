const grid = document.getElementById("grid");
const resetButton = document.getElementById("reset");

// Soothing pastel colors
const colors = [
  "#ffd6e0", "#c9fdd7", "#d2f0fc", "#fcecc9", "#e0d6ff",
  "#ffe4d6", "#d6f5ff", "#f9d6ff"
];

function createGrid(rows = 6, cols = 6) {
  grid.innerHTML = ""; // Clear previous grid
  for (let i = 0; i < rows * cols; i++) {
    const block = document.createElement("div");
    block.classList.add("block");
    block.addEventListener("click", () => {
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      block.style.backgroundColor = randomColor;
    });
    grid.appendChild(block);
  }
}

// Reset colors
resetButton.addEventListener("click", () => {
  const blocks = document.querySelectorAll(".block");
  blocks.forEach(block => block.style.backgroundColor = "#fff");
});

// Initialize
createGrid();
