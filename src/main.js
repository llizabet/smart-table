import './fonts/ys-display/fonts.css'
import './style.css'

import {data as sourceData} from "./data/dataset_1.js";

import {initData} from "./data.js";
import {processFormData} from "./lib/utils.js";

import {initTable} from "./components/table.js";
// Подключение модуля пагинации
import {initPagination} from "./components/pagination.js";
// Подключение модуля сортировки
import {initSorting} from "./components/sorting.js";
// Подключение модуля фильтрации
import {initFiltering} from "./components/filtering.js";
// Подключение модуля поиска
import {initSearching} from "./components/searching.js";


// Исходные данные используемые в render()
const {data, ...indexes} = initData(sourceData);

/**
 * Сбор и обработка полей из таблицы
 * @returns {Object}
 */
function collectState() {
    const state = processFormData(new FormData(sampleTable.container));

    const rowsPerPage = parseInt(state.rowsPerPage);    // приведём количество страниц к числу
    const page = parseInt(state.page ?? 1);                // номер страницы по умолчанию 1 и тоже число

    return {                                            // расширьте существующий return вот так
        ...state,
        rowsPerPage,
        page
    };
}

/**
 * Перерисовка состояния таблицы при любых изменениях
 * @param {HTMLButtonElement?} action
 */
function render(action) {
    let state = collectState(); // состояние полей из таблицы
    let result = [...data]; // копируем для последующего изменения
    
    // Применяем поиск
    if (applySearching) {
        result = applySearching(result, state, action);
    }
    
    // Применяем фильтрацию
    if (applyFiltering) {
        result = applyFiltering(result, state, action);
    }
    
    // Применяем сортировку
    if (applySorting) {
        result = applySorting(result, state, action);
    }
    
    // Применяем пагинацию
    if (applyPagination) {
        result = applyPagination(result, state, action);
    }

    sampleTable.render(result)
}

const sampleTable = initTable({
    tableTemplate: 'table',
    rowTemplate: 'row',
    before: ['search', 'header', 'filter'], // ← Добавляем шаблон search первым
    after: ['pagination']
}, render);

// Инициализация поиска
let applySearching;
if (sampleTable.search) {
    applySearching = initSearching('search'); // передаем имя поля поиска
}

// Инициализация фильтрации
let applyFiltering;
if (sampleTable.filter) {
    applyFiltering = initFiltering(sampleTable.filter.elements, {
        searchBySeller: indexes.sellers // для элемента с именем searchBySeller устанавливаем массив продавцов
    });
}

// Инициализация сортировки
let applySorting;
if (sampleTable.header) {
    applySorting = initSorting([
        sampleTable.header.elements.sortByDate,
        sampleTable.header.elements.sortByTotal
    ]);
}

// Инициализация пагинации
let applyPagination;
if (sampleTable.pagination) {
    applyPagination = initPagination(
        sampleTable.pagination.elements,
        (el, page, isCurrent) => {
            const input = el.querySelector('input');
            const label = el.querySelector('span');
            input.value = page;
            input.checked = isCurrent;
            label.textContent = page;
            return el;
        }
    );
}


const appRoot = document.querySelector('#app');
appRoot.appendChild(sampleTable.container);

render();