import {makeIndex} from "./lib/utils.js";

// Константа с адресом сервера
const BASE_URL = 'https://webinars.webdev.education-services.ru/sp7-api';

export function initData(sourceData) {
    // Если sourceData предоставлен (локальные данные), используем его
    if (sourceData) {
        const sellers = makeIndex(sourceData.sellers, 'id', v => `${v.first_name} ${v.last_name}`);
        const customers = makeIndex(sourceData.customers, 'id', v => `${v.first_name} ${v.last_name}`);
        const data = sourceData.purchase_records.map(item => ({
            id: item.receipt_id,
            date: item.date,
            seller: sellers[item.seller_id],
            customer: customers[item.customer_id],
            total: item.total_amount
        }));
        
        // Для локального режима возвращаем те же функции, но синхронные
        return {
            getIndexes: async () => ({ sellers, customers }),
            getRecords: async (query) => {
                let filteredData = [...data];
                const total = filteredData.length;
                
                // Применяем простую пагинацию для локальных данных
                const page = query?.page || 1;
                const limit = query?.limit || 10;
                const startIndex = (page - 1) * limit;
                const endIndex = startIndex + limit;
                
                return {
                    total,
                    items: filteredData.slice(startIndex, endIndex)
                };
            }
        };
    }
    
    // Переменные для кеширования данных
    let sellers;
    let customers;
    let lastResult;
    let lastQuery;

    // Функция для приведения строк в тот вид, который нужен нашей таблице
    const mapRecords = (data) => data.map(item => ({
        id: item.receipt_id,
        date: item.date,
        seller: sellers[item.seller_id],
        customer: customers[item.customer_id],
        total: item.total_amount
    }));

    // Функция получения индексов
    const getIndexes = async () => {
        if (!sellers || !customers) { // если индексы ещё не установлены, то делаем запросы
            try {
                // Запрашиваем и деструктурируем в уже объявленные ранее переменные
                [sellers, customers] = await Promise.all([
                    fetch(`${BASE_URL}/sellers`).then(res => res.json()),
                    fetch(`${BASE_URL}/customers`).then(res => res.json()),
                ]);
            } catch (error) {
                console.error('Error fetching indexes:', error);
                // Возвращаем пустые объекты в случае ошибки
                sellers = sellers || {};
                customers = customers || {};
            }
        }

        return { sellers, customers };
    };

    // Функция получения записей о продажах с сервера
    const getRecords = async (query = {}, isUpdated = false) => {
        try {
            const qs = new URLSearchParams(query); // преобразуем объект параметров в SearchParams
            const nextQuery = qs.toString(); // и приводим к строковому виду

            if (lastQuery === nextQuery && !isUpdated) { // isUpdated параметр нужен, чтобы иметь возможность делать запрос без кеша
                return lastResult; // если параметры запроса не поменялись, то отдаём сохранённые ранее данные
            }

            // Если прошлый квери не был ранее установлен или поменялись параметры, то запрашиваем данные с сервера
            const response = await fetch(`${BASE_URL}/records?${nextQuery}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const records = await response.json();

            lastQuery = nextQuery; // сохраняем для следующих запросов
            lastResult = {
                total: records.total,
                items: mapRecords(records.items)
            };

            return lastResult;
        } catch (error) {
            console.error('Error fetching records:', error);
            // Возвращаем пустой результат в случае ошибки
            return {
                total: 0,
                items: []
            };
        }
    };

    return {
        getIndexes,
        getRecords
    };
}