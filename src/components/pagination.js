import { getPages } from "../lib/utils.js";

export const initPagination = (
  { pages, fromRow, toRow, totalRows },
  createPage
) => {
  // @todo: #2.3 — подготовить шаблон кнопки для страницы и очистить контейнер
  const pageTemplate = pages.firstElementChild.cloneNode(true); // в качестве шаблона берём первый элемент из контейнера со страницами
  pages.firstElementChild.remove();

  // Временная переменная для хранения количества страниц
  let pageCount;
  let currentPage = 1;
  let currentLimit = 10;
  let totalRowsValue = 0;

  // Функция для применения параметров пагинации к query
  const applyPagination = (query, state, action) => {
    const limit = state.rowsPerPage || 10;
    let page = state.page || 1;

    // @todo: #2.6 — обработать действия
    if (action)
      switch (action.name) {
        case "prev":
          page = Math.max(1, page - 1);
          break; // переход на предыдущую страницу
        case "next":
          page = Math.min(pageCount || Infinity, page + 1);
          break; // переход на следующую страницу
        case "first":
          page = 1;
          break; // переход на первую страницу
        case "last":
          page = pageCount || 1;
          break; // переход на последнюю страницу
      }

    // Сохраняем текущие значения для использования в updatePagination
    currentPage = page;
    currentLimit = limit;

    return Object.assign({}, query, {
      // добавим параметры к query, но не изменяем исходный объект
      limit,
      page,
    });
  };

  // Функция для обновления UI пагинации после получения данных
  const updatePagination = (total, { page, limit } = {}) => {
    // Обновляем значения из параметров, если они переданы
    if (page !== undefined) currentPage = page;
    if (limit !== undefined) currentLimit = limit;

    // Сохраняем общее количество строк
    totalRowsValue = total;

    // Вычисляем количество страниц
    pageCount = Math.ceil(total / currentLimit);

    // Если pageCount = 0 (нет данных), устанавливаем 1 страницу
    if (pageCount === 0) pageCount = 1;

    // Проверяем, что текущая страница не превышает количество страниц
    if (currentPage > pageCount && pageCount > 0) {
      currentPage = pageCount;
    }

    // @todo: #2.4 — получить список видимых страниц и вывести их
    const visiblePages = getPages(currentPage, pageCount, 5); // Получим массив страниц, которые нужно показать, выводим только 5 страниц

    // Очищаем и заполняем контейнер страниц
    pages.replaceChildren(
      ...visiblePages.map((pageNumber) => {
        const el = pageTemplate.cloneNode(true); // клонируем шаблон, который запомнили ранее
        return createPage(el, pageNumber, pageNumber === currentPage); // вызываем колбэк из настроек, чтобы заполнить кнопку данными
      })
    );

    // @todo: #2.5 — обновить статус пагинации
    // Рассчитываем диапазон отображаемых строк
    const startRow = Math.min((currentPage - 1) * currentLimit + 1, total);
    const endRow = Math.min(currentPage * currentLimit, total);

    fromRow.textContent = startRow; // С какой строки выводим
    toRow.textContent = endRow; // До какой строки выводим
    totalRows.textContent = total; // Общее количество строк

    // Также обновляем элементы управления, если они есть
    updateNavigationButtons();
  };

  // Дополнительная функция для обновления состояния кнопок навигации
  const updateNavigationButtons = () => {
    // Находим кнопки навигации по их имени (если они есть)
    const navButtons = pages.parentElement?.querySelectorAll("[name]");
    if (navButtons) {
      navButtons.forEach((button) => {
        const isDisabled =
          button.name === "prev" || button.name === "first"
            ? currentPage === 1
            : button.name === "next" || button.name === "last"
            ? currentPage === pageCount
            : false;

        if (isDisabled) {
          button.setAttribute("disabled", "disabled");
        } else {
          button.removeAttribute("disabled");
        }
      });
    }
  };

  // Инициализация начального состояния
  updatePagination(0, { page: 1, limit: currentLimit });

  return {
    applyPagination,
    updatePagination,
  };
};
