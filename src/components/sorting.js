import {sortMap} from "../lib/sort.js"; // sortCollection больше не нужен

export function initSorting(columns) {
    return (query, state, action) => {
        let field = null;
        let order = null;

        if (action && action.name === 'sort') {
            // запомнить выбранный режим сортировки
            action.dataset.value = sortMap[action.dataset.value];    // Сохраним и применим как текущее следующее состояние из карты
            field = action.dataset.field;                            // Информация о сортируемом поле есть также в кнопке
            order = action.dataset.value;                            // Направление заберём прямо из датасета для точности

            // сбросить сортировки остальных колонок
            columns.forEach(col => {
                if (col !== action) {
                    col.dataset.value = '';
                }
            });
        } else {
            // @todo: #3.3 — получить выбранный режим сортировки
            columns.forEach(column => {                        // Перебираем все наши кнопки сортировки
                if (column.dataset.value !== 'none') {        // Ищем ту, что находится не в начальном состоянии (предполагаем, что одна)
                    field = column.dataset.field;            // Сохраняем в переменных поле
                    order = column.dataset.value;            // и направление сортировки
                }
            }); 
        }

        // Сохраняем параметр сортировки в виде field:direction
        const sort = (field && order !== 'none') ? `${field}:${order}` : null;

        // По общему принципу, если есть сортировка, добавляем, если нет, то не трогаем query
        return sort ? Object.assign({}, query, { sort }) : query;
    };
}