export function initFiltering(elements) {
  const updateIndexes = (elements, indexes) => {
    Object.keys(indexes).forEach((elementName) => {
      if (elements[elementName]) {
        // Очищаем и добавляем опции
        elements[elementName].innerHTML = '<option value="">Все</option>';
        Object.values(indexes[elementName]).forEach((name) => {
          const option = document.createElement("option");
          option.value = name;
          option.textContent = name;
          elements[elementName].appendChild(option);
        });
      }
    });
  };

  const applyFiltering = (query, state, action) => {
    // Обработка очистки
    if (action && action.name === "clear") {
      const fieldName = action.dataset.field;
      const parent = action.closest("[data-element]") || action.parentElement;
      const input = parent.querySelector("input, select");
      if (input) {
        input.value = "";
      }
    }

    // Формируем фильтры
    const newQuery = { ...query };

    Object.keys(elements).forEach((key) => {
      const element = elements[key];
      if (element && ["INPUT", "SELECT"].includes(element.tagName)) {
        const value = element.value;
        if (value) {
          // Правильное формирование параметров фильтра
          newQuery[`filter[${element.name}]`] = value;
        } else {
          // Удаляем пустые фильтры
          delete newQuery[`filter[${element.name}]`];
        }
      }
    });

    return newQuery;
  };

  return {
    updateIndexes,
    applyFiltering,
  };
}
