import { sortMap } from "../lib/sort.js";

export function initSorting(columns) {
  return (query, state, action) => {
    let field = null;
    let order = null;

    if (action && action.name === "sort") {
      action.dataset.value = sortMap[action.dataset.value] || "asc";
      field = action.dataset.field;
      order = action.dataset.value;

      // Сбрасываем другие колонки
      columns.forEach((col) => {
        if (col !== action) {
          col.dataset.value = "";
        }
      });
    } else {
      // Ищем активную сортировку
      columns.forEach((column) => {
        if (column.dataset.value && column.dataset.value !== "none") {
          field = column.dataset.field;
          order = column.dataset.value;
        }
      });
    }

    // Формируем параметр сортировки
    if (field && order && order !== "none") {
      return { ...query, sort: `${field}:${order}` };
    }

    // Если сортировка отключена, удаляем параметр
    const { sort, ...rest } = query;
    return rest;
  };
}
