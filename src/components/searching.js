import {rules, createComparison} from "../lib/compare.js";

export function initSearching(searchField) {
    // настроить компаратор
    const comparator = createComparison(
        [rules.skipEmptyTargetValues], // пропускаем пустые значения поиска
        [rules.searchMultipleFields(searchField, ['date', 'customer', 'seller'], false)]
    );

    return (data, state, action) => {
        // применить компаратор
        const searchValue = state[searchField] || '';
        return data.filter(item => comparator(item, searchValue));
    }
}