export function sortTable(tar) {
  const whichSort = tar.classList;
  const table = document.getElementById("mainTable").querySelector("tbody");
  const rows = table.rows;
  const sortBy = determineSortParameter(whichSort);
  const rowMap = new Map();
  for (const row of Array.from(table.rows)) {
    const param = +row
      .querySelector(sortBy)
      ?.innerHTML.replaceAll(" ", "")
      .replace("%", "");
    // create Map in which sorting parameters will be keys and their rows - values
    rowMap.set(param, row);
  }
  const sortedArray = [...rowMap];
  // prettier-ignore
  sortedArray.sort((a, b) => whichSort.contains("Up") ? b[0] - a[0] : a[0] - b[0]);
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
  let sortBy;
  whichSort.contains("sortSigma") && (sortBy = ".sigma-row");
  whichSort.contains("sortChange") && (sortBy = "#change-field");
  whichSort.contains("sortDay") && (sortBy = "#day-one");
  return sortBy;
}
