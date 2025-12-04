import {createComparison, defaultRules} from "../lib/compare.js";

// @todo: #4.3 — настроить компаратор
const compare = createComparison(defaultRules); 
export function initFiltering(elements, indexes) {
    // заполнить выпадающие списки опциями
    Object.keys(indexes)                                    // Получаем ключи из объекта
        .forEach((elementName) => {                        // Перебираем по именам
            elements[elementName].append(                    // в каждый элемент добавляем опции
                ...Object.values(indexes[elementName])        // формируем массив имён, значений опций
                    .map(name => {                        // используйте name как значение и текстовое содержимое
                        // создать и вернуть тег опции
                        const option = document.createElement('option');
                        option.value = name;
                        option.textContent = name;
                        return option;
                    })
            )
        });

    return (data, state, action) => {
        // обработать очистку поля
        if (action && action.name === 'clear') {
            const fieldName = action.dataset.field;
            // Находим родительский элемент кнопки и ищем в нем input
            const parent = action.closest('[data-element]') || action.parentElement;
            const input = parent.querySelector('input, select');
            
            if (input) {
                input.value = ''; // Сбрасываем значение поля
            }
            
            // Сбрасываем значение в state
            if (fieldName && state[fieldName]) {
                state[fieldName] = '';
            }
        }

        // @todo: #4.5 — отфильтровать данные используя компаратор
        return data.filter(row => compare(row, state)); 
    }
}