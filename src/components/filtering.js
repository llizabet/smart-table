export function initFiltering(elements) {
    // Функция для обновления индексов (заполнения селектов опциями)
    const updateIndexes = (elements, indexes) => {
        Object.keys(indexes).forEach((elementName) => {
            // Проверяем, существует ли элемент
            if (elements[elementName]) {
                // Очищаем существующие опции (кроме первой пустой)
                while (elements[elementName].options.length > 1) {
                    elements[elementName].remove(1);
                }
                
                // Добавляем новые опции
                Object.values(indexes[elementName]).forEach(name => {
                    const el = document.createElement('option');
                    el.textContent = name;
                    el.value = name;
                    elements[elementName].append(el);
                });
            }
        });
    };

    // Функция для применения фильтрации к query
    const applyFiltering = (query, state, action) => {
        // Обработать очистку поля
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
            
            // Сбрасываем соответствующий параметр в query
            if (fieldName) {
                delete state[fieldName];
            }
        }

        // Формируем фильтры для query
        const filter = {};
        Object.keys(elements).forEach(key => {
            if (elements[key]) {
                if (['INPUT', 'SELECT'].includes(elements[key].tagName) && elements[key].value) {
                    // Добавляем фильтр в формате, который понимает сервер
                    filter[`filter[${elements[key].name}]`] = elements[key].value;
                }
            }
        });

        // Если есть фильтры, добавляем их к query
        return Object.keys(filter).length ? Object.assign({}, query, filter) : query;
    };

    return {
        updateIndexes,
        applyFiltering
    };
}