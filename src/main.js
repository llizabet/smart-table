import { initData } from "./data.js";
import { processFormData } from "./lib/utils.js";

import { initTable } from "./components/table.js";
import { initPagination } from "./components/pagination.js";
import { initSorting } from "./components/sorting.js";
import { initFiltering } from "./components/filtering.js";
import { initSearching } from "./components/searching.js";

const api = initData(); // не передаем sourceData

/**
 * Сбор и обработка полей из таблицы
 * @returns {Object}
 */
function collectState() {
  const state = processFormData(new FormData(sampleTable.container));

  const rowsPerPage = parseInt(state.rowsPerPage) || 10;
  const page = parseInt(state.page) || 1;

  return {
    ...state,
    rowsPerPage,
    page,
  };
}

/**
 * Перерисовка состояния таблицы при любых изменениях
 * @param {HTMLButtonElement?} action
 */
async function render(action) {
  console.log("Render called with action:", action?.name); // Для отладки

  let state = collectState();
  console.log("Collected state:", state); // Для отладки

  let query = {};

  // Формируем query параметры
  if (applySearching) {
    query = applySearching(query, state, action);
  }

  if (applyFiltering) {
    query = applyFiltering(query, state, action);
  }

  if (applySorting) {
    query = applySorting(query, state, action);
  }

  if (applyPagination) {
    query = applyPagination(query, state, action);
  }

  console.log("Query to server:", query); // Для отладки

  try {
    // Получаем данные с сервера
    const { total, items } = await api.getRecords(query);
    console.log("Received from server - total:", total, "items:", items.length); // Для отладки

    // Обновляем UI пагинации
    if (updatePagination) {
      updatePagination(total, {
        page: query.page || state.page || 1,
        limit: query.limit || state.rowsPerPage || 10,
      });
    }

    // Рендерим данные
    sampleTable.render(items);
  } catch (error) {
    console.error("Error in render:", error);
    sampleTable.render([]);
  }
}

const sampleTable = initTable(
  {
    tableTemplate: "table",
    rowTemplate: "row",
    before: ["search", "header", "filter"],
    after: ["pagination"],
  },
  render
);

// Инициализация компонентов
let applySearching;
if (sampleTable.search) {
  applySearching = initSearching("search");
}

let applyFiltering;
let updateFilterIndexes;
if (sampleTable.filter) {
  const filteringFunctions = initFiltering(sampleTable.filter.elements);
  applyFiltering = filteringFunctions.applyFiltering;
  updateFilterIndexes = filteringFunctions.updateIndexes;
}

let applySorting;
if (sampleTable.header) {
  applySorting = initSorting([
    sampleTable.header.elements.sortByDate,
    sampleTable.header.elements.sortByTotal,
  ]);
}

let applyPagination;
let updatePagination;
if (sampleTable.pagination) {
  const paginationFunctions = initPagination(
    sampleTable.pagination.elements,
    (el, page, isCurrent) => {
      const input = el.querySelector("input");
      const label = el.querySelector("span");
      input.value = page;
      input.checked = isCurrent;
      label.textContent = page;
      return el;
    }
  );
  applyPagination = paginationFunctions.applyPagination;
  updatePagination = paginationFunctions.updatePagination;
}

const appRoot = document.querySelector("#app");
appRoot.appendChild(sampleTable.container);


async function init() {
  try {
    console.log("Initializing app...");

    // Получаем индексы с сервера
    const indexes = await api.getIndexes();
    console.log("Indexes loaded:", indexes);

    // Обновляем фильтры
    if (updateFilterIndexes && sampleTable.filter && indexes.sellers) {
      updateFilterIndexes(sampleTable.filter.elements, {
        searchBySeller: indexes.sellers,
      });
    }

    // Первоначальная загрузка данных
    await render();
  } catch (error) {
    console.error("Failed to initialize app:", error);
    // Показываем пустую таблицу в случае ошибки
    sampleTable.render([]);
  }
}

// Экспортируем переменные в глобальную область
window.render = render;
window.sampleTable = sampleTable;
window.api = api;
window.applySearching = applySearching;
window.applyFiltering = applyFiltering;
window.applySorting = applySorting;
window.applyPagination = applyPagination;
window.updatePagination = updatePagination;

console.log("✅ Глобальные переменные экспортированы");
console.log("Доступны: window.render, window.sampleTable, window.api");

init();
