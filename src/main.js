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


// Инициализируем API (локальный или серверный режим в зависимости от наличия sourceData)
const api = initData(sourceData); // передаем sourceData для локального режима, или null для серверного

// Глобальный объект состояния для запросов к серверу
const apiState = {
    page: 1,
    rowsPerPage: 10,
    search: '',
    filters: {},
    sortBy: null,
    sortOrder: 'asc'
};

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
 * Формирование параметров запроса для сервера
 * @param {Object} state - текущее состояние UI
 * @returns {Object} - параметры для API запроса
 */
function buildRequestParams(state) {
    const params = {
        page: state.page || 1,
        limit: state.rowsPerPage || 10
    };
    
    // Добавляем поиск
    if (state.search && state.search.trim()) {
        params.search = state.search.trim();
    }
    
    // Добавляем фильтры
    if (state.seller) {
        params.seller = state.seller;
    }
    if (state.status) {
        params.status = state.status;
    }
    // Добавьте другие фильтры по аналогии
    
    // Добавляем сортировку
    if (state.sortBy) {
        params.sortBy = state.sortBy;
        params.sortOrder = state.sortOrder || 'asc';
    }
    
    return params;
}

/**
 * Перерисовка состояния таблицы при любых изменениях
 * @param {HTMLButtonElement?} action
 */
async function render(action) {
    let state = collectState(); // состояние полей из таблицы
    let query = {}; // здесь будут формироваться параметры запроса
    
    // Применяем поиск (обновляет query)
    if (applySearching) {
        query = applySearching(query, state, action);
    }
    
    // Применяем фильтрацию (обновляет query)
    if (applyFiltering) {
        query = applyFiltering(query, state, action);
    }
    
    // Применяем сортировку (обновляет query)
    if (applySorting) {
        query = applySorting(query, state, action);
    }
    
    // Применяем пагинацию (обновляет query)
    if (applyPagination) {
        query = applyPagination(query, state, action);
    }

    // Получаем данные с сервера с собранными параметрами
    const { total, items } = await api.getRecords(query);

    // Обновляем UI пагинации после получения данных
    if (updatePagination) {
        updatePagination(total, { page: state.page || 1, limit: state.rowsPerPage || 10 });
    }
    
    // Рендерим данные в таблице
    sampleTable.render(items);
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
let updateFilterIndexes;
if (sampleTable.filter) {
    const filteringFunctions = initFiltering(sampleTable.filter.elements);
    applyFiltering = filteringFunctions.applyFiltering;
    updateFilterIndexes = filteringFunctions.updateIndexes;
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
let updatePagination;
if (sampleTable.pagination) {
    const paginationFunctions = initPagination(
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
    applyPagination = paginationFunctions.applyPagination;
    updatePagination = paginationFunctions.updatePagination;
}

const appRoot = document.querySelector('#app');
appRoot.appendChild(sampleTable.container);

/**
 * Асинхронная функция инициализации приложения
 */
async function init() {
    try {
        // Получаем индексы (продавцов и покупателей)
        const indexes = await api.getIndexes();
        console.log('Indexes loaded:', indexes);
        
        // Обновляем фильтры после загрузки индексов
        if (updateFilterIndexes && sampleTable.filter) {
            updateFilterIndexes(sampleTable.filter.elements, {
                searchBySeller: indexes.sellers
            });
        }
        
        return indexes;
    } catch (error) {
        console.error('Error during initialization:', error);
        return {};
    }
}

// Заменяем вызов render на init().then(render)
init().then(() => {
    // Запускаем первоначальный рендер
    render();
}).catch(error => {
    console.error('Failed to initialize app:', error);
    // Даже если инициализация не удалась, показываем таблицу
    render();
});