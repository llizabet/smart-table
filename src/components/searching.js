export function initSearching(searchField) {
    // Теперь не нужен компаратор, так как поиск выполняется на сервере
    
    return (query, state, action) => {
        // Проверяем, что в поле поиска было что-то введено
        if (state[searchField] && state[searchField].trim()) {
            // Устанавливаем в query параметр search
            return Object.assign({}, query, {
                search: state[searchField].trim()
            });
        }
        
        // Если поле с поиском пустое, просто возвращаем query без изменений
        return query;
    };
}