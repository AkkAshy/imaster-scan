import axios from 'axios';

// API URL можно переключать между локальным и продакшен
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Сканирование QR кода — поиск оборудования по ИНН или UID
export const scanEquipment = async (code) => {
  try {
    const response = await api.get(`/inventory/equipment/scan/${code}/?expand=type,room,warehouse,author`);
    return { success: true, data: response.data };
  } catch (error) {
    if (error.response?.status === 404) {
      return { success: false, error: 'Оборудование не найдено' };
    }
    return { success: false, error: error.message || 'Ошибка при сканировании' };
  }
};

// Получить информацию о комнате по UID (QR код комнаты)
export const scanRoom = async (uid) => {
  try {
    const response = await api.get(`/university/rooms/scan/${uid}/`);
    return { success: true, data: response.data };
  } catch (error) {
    if (error.response?.status === 404) {
      return { success: false, error: 'Комната не найдена' };
    }
    return { success: false, error: error.message || 'Ошибка при сканировании' };
  }
};

export default api;
