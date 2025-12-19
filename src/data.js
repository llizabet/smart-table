import {makeIndex} from "./lib/utils.js";

// Константа с адресом сервера
const BASE_URL = 'https://webinars.webdev.education-services.ru/sp7-api';

export function initData(sourceData) {
    // Если sourceData предоставлен (для локального режима), используем его
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
    const mapRecords = (data) => {
        if (!sellers || !customers) {
            console.warn('sellers или customers не определены при вызове mapRecords');
            // Возвращаем данные с ID вместо имен
            return data.map(item => ({
                id: item.receipt_id,
                date: item.date,
                seller: `Seller ${item.seller_id}`, // временное решение
                customer: `Customer ${item.customer_id}`,
                total: item.total_amount
            }));
        }
        
        return data.map(item => ({
            id: item.receipt_id,
            date: item.date,
            seller: sellers[item.seller_id] || `Seller ${item.seller_id}`,
            customer: customers[item.customer_id] || `Customer ${item.customer_id}`,
            total: item.total_amount
        }));
    };

    // Функция получения индексов
    const getIndexes = async () => {
        if (!sellers || !customers) {
            try {
                // Запрашиваем продавцов и покупателей с сервера
                [sellers, customers] = await Promise.all([
                    fetch(`${BASE_URL}/sellers`).then(res => {
                        if (!res.ok) throw new Error(`Sellers: ${res.status}`);
                        return res.json();
                    }),
                    fetch(`${BASE_URL}/customers`).then(res => {
                        if (!res.ok) throw new Error(`Customers: ${res.status}`);
                        return res.json();
                    }),
                ]);
                
                console.log('Индексы загружены:');
                console.log('Продавцов:', Object.keys(sellers).length);
                console.log('Покупателей:', Object.keys(customers).length);
            } catch (error) {
                console.error('Ошибка загрузки индексов:', error);
                // Инициализируем пустыми объектами в случае ошибки
                sellers = sellers || {};
                customers = customers || {};
            }
        }

        return { sellers, customers };
    };

    // Функция получения записей о продажах с сервера
    const getRecords = async (query = {}, isUpdated = false) => {
        try {
            // Убедимся что индексы загружены перед запросом
            if (!sellers || !customers) {
                console.log('🔄 Загружаем индексы перед запросом записей...');
                await getIndexes();
            }
            
            const qs = new URLSearchParams();
    
            qs.append('page', query.page || 1);
            qs.append('limit', query.limit || 10);
            
            // ПОИСК - используем 'search' (поддерживается API)
            if (query.search && query.search.trim()) {
                qs.append('search', query.search.trim());
            }
            
            // Поддерживаемые поля фильтрации
            const supportedFilterFields = ['seller', 'customer', 'date', 'total'];
            
            // Обрабатываем параметры в формате filter[field] (из filtering.js)
            Object.keys(query).forEach(key => {
                if (key.startsWith('filter[')) {
                    const value = query[key];
                    if (value && value.trim()) {
                        qs.append(key, value.trim());
                    }
                }
            });
            
            // обрабатываем простые параметры (если они переданы напрямую)
            supportedFilterFields.forEach(field => {
                if (query[field] && query[field].trim()) {
                    qs.append(`filter[${field}]`, query[field].trim());
                }
            });
            
            // Специальная обработка для диапазона total (если есть totalFrom/totalTo)
            if (query.totalFrom || query.totalTo) {
                if (query.totalFrom && query.totalTo) {
                    qs.append('filter[total]', `${query.totalFrom}-${query.totalTo}`);
                } else if (query.totalFrom) {
                    qs.append('filter[total]', `>=${query.totalFrom}`);
                } else if (query.totalTo) {
                    qs.append('filter[total]', `<=${query.totalTo}`);
                }
            }
            
            const nextQuery = qs.toString();
            
            // Кэширование запросов (чтобы не делать одинаковые запросы)
            if (lastQuery === nextQuery && !isUpdated) {
                console.log('Используем кэшированные данные');
                return lastResult;
            }

            console.log('Запрос к серверу:', `${BASE_URL}/records?${nextQuery}`);
            
            // Делаем запрос к серверу
            const response = await fetch(`${BASE_URL}/records?${nextQuery}`);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Ошибка сервера:', response.status, response.statusText);
                console.error('Ответ сервера:', errorText);
                
                // Если ошибка 400, попробуем упрощенный запрос без фильтров
                if (response.status === 400) {
                    console.log('🔄 Пробуем упрощенный запрос без фильтров...');
                    
                    // Создаем упрощенный запрос только с пагинацией
                    const simpleQs = new URLSearchParams();
                    simpleQs.append('page', query.page || 1);
                    simpleQs.append('limit', query.limit || 10);
                    
                    if (query.search && query.search.trim()) {
                        simpleQs.append('search', query.search.trim());
                    }
                    
                    const simpleUrl = `${BASE_URL}/records?${simpleQs.toString()}`;
                    console.log('   Упрощенный запрос:', simpleUrl);
                    
                    const simpleResponse = await fetch(simpleUrl);
                    
                    if (simpleResponse.ok) {
                        const simpleData = await simpleResponse.json();
                        lastQuery = simpleQs.toString();
                        lastResult = {
                            total: simpleData.total || 0,
                            items: mapRecords(simpleData.items || [])
                        };
                        return lastResult;
                    }
                }
                
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            
            // Получаем данные
            const records = await response.json();
            console.log(`Успешный ответ: ${records.total} всего, ${records.items?.length || 0} на странице`);

            // Сохраняем запрос и результат для кэширования
            lastQuery = nextQuery;
            lastResult = {
                total: records.total || 0,
                items: mapRecords(records.items || [])
            };

            return lastResult;
        } catch (error) {
            console.error('Ошибка получения записей:', error.message);
            
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