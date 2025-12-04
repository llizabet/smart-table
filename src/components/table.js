import {cloneTemplate} from "../lib/utils.js";

/**
 * Инициализирует таблицу и вызывает коллбэк при любых изменениях и нажатиях на кнопки
 *
 * @param {Object} settings
 * @param {(action: HTMLButtonElement | undefined) => void} onAction
 * @returns {{container: Node, elements: *, render: render}}
 */
export function initTable(settings, onAction) {
    const {tableTemplate, rowTemplate, before, after} = settings;
    const root = cloneTemplate(tableTemplate);

    // Вывести дополнительные шаблоны до и после таблицы
    // Добавляем шаблоны "до" таблицы в обратном порядке
    if (before && before.length > 0) {
        before.reverse().forEach(templateId => {
            root[templateId] = cloneTemplate(templateId);
            root.container.prepend(root[templateId].container);
        });
    }
    
    // Добавляем шаблоны "после" таблицы
    if (after && after.length > 0) {
        after.forEach(templateId => {
            root[templateId] = cloneTemplate(templateId);
            root.container.append(root[templateId].container);
        });
    }

    // Обработать события и вызвать onAction()
    // Обработка события change
    root.container.addEventListener('change', () => {
        onAction();
    });
    
    // Обработка события reset
    root.container.addEventListener('reset', () => {
        setTimeout(onAction);
    });
    
    // Обработка события submit
    root.container.addEventListener('submit', (e) => {
        e.preventDefault();
        onAction(e.submitter);
    });

    const render = (data) => {
        // Преобразовать данные в массив строк на основе шаблона rowTemplate
        const nextRows = data.map(item => {
            const row = cloneTemplate(rowTemplate);
            // Заполняем строку данными
            Object.keys(item).forEach(key => {
                if (row.elements[key]) {
                    row.elements[key].textContent = item[key];
                }
            });
            return row.container;
        });
        root.elements.rows.replaceChildren(...nextRows);
    }

    return {...root, render};
}