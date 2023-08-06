export function sortTable(tar) {
  const whichSort = tar.classList;
  const table = document.getElementById("mainTable").querySelector("tbody");
  const rows = table.rows;
  const crit = determineSortParameter(whichSort);
  const rowMap = new Map();
  for (let [_, row] of Array.from(table.rows).entries()) {
    const param = +row
      .querySelector(crit)
      ?.innerHTML.replaceAll(" ", "")
      .replace("%", "");
    rowMap.set(param, row);
  }
  const sortedArray = [...rowMap];
  sortedArray.sort((a, b) =>
    whichSort.contains("Up") ? b[0] - a[0] : a[0] - b[0]
  );
  const sortedMap = new Map(sortedArray);
  let index = 0;
  for (let [_, row] of sortedMap) {
    const parent = row.parentNode;
    parent.removeChild(row);
    const targetRow = rows[index];
    parent.insertBefore(row, targetRow);
    index++;
  }
  // switch classes after sorting in the main table
  whichSort.contains("Up")
    ? whichSort.replace("Up", "Down")
    : whichSort.replace("Down", "Up");
}

function determineSortParameter(whichSort) {
  let crit;
  whichSort.contains("sortSigma") && (crit = ".sigma-row");
  whichSort.contains("sortChange") && (crit = "#change-field");
  whichSort.contains("sortDay") && (crit = "#day-one");
  return crit;
}
