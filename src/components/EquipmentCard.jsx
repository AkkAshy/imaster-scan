// Статусы: new (Новое), broken (Сломано), in_repair (На ремонте), disposed (Утилизировано)
const statusConfig = {
  new: { label: 'Новое', class: 'status-new' },
  broken: { label: 'Сломано', class: 'status-broken' },
  in_repair: { label: 'На ремонте', class: 'status-in_repair' },
  disposed: { label: 'Утилизировано', class: 'status-disposed' },
};

const EquipmentCard = ({ equipment, onScanAgain }) => {
  if (!equipment) return null;

  const status = statusConfig[equipment.status] || { label: equipment.status, class: 'status-badge' };

  // Получаем название типа (expand возвращает объект, без expand — id)
  const getTypeName = () => {
    if (typeof equipment.type === 'object' && equipment.type?.name) {
      return equipment.type.name;
    }
    if (equipment.type_data?.name) {
      return equipment.type_data.name;
    }
    return 'Неизвестный тип';
  };
  const typeName = getTypeName();

  // Получаем информацию о местоположении
  const getLocation = () => {
    // Проверяем expand room
    if (typeof equipment.room === 'object' && equipment.room) {
      const num = equipment.room.number || '';
      const name = equipment.room.name || '';
      return `${num} ${name}`.trim() || 'Кабинет';
    }
    // Проверяем room_data
    if (equipment.room_data) {
      const num = equipment.room_data.number || '';
      const name = equipment.room_data.name || '';
      return `${num} ${name}`.trim() || 'Кабинет';
    }
    // Проверяем expand warehouse
    if (typeof equipment.warehouse === 'object' && equipment.warehouse?.name) {
      return equipment.warehouse.name;
    }
    // Проверяем warehouse_data
    if (equipment.warehouse_data?.name) {
      return equipment.warehouse_data.name;
    }
    return 'Не указано';
  };
  const location = getLocation();

  // Получаем автора
  const getAuthor = () => {
    if (typeof equipment.author === 'object' && equipment.author) {
      return equipment.author;
    }
    return equipment.author_data;
  };
  const author = getAuthor();

  // Форматируем дату
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="tech-card overflow-hidden">
      {/* Заголовок с фото */}
      <div className="relative">
        {equipment.photo ? (
          <img
            src={equipment.photo}
            alt={equipment.name}
            className="w-full h-48 object-cover"
          />
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-indigo-600/30 via-purple-600/20 to-cyan-600/30 flex items-center justify-center relative">
            {/* Сетка на фоне */}
            <div className="absolute inset-0 opacity-20"
                 style={{
                   backgroundImage: 'linear-gradient(rgba(99, 102, 241, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(99, 102, 241, 0.3) 1px, transparent 1px)',
                   backgroundSize: '20px 20px'
                 }} />
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 border border-indigo-500/30 flex items-center justify-center">
                <svg className="w-10 h-10 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
              </div>
            </div>
          </div>
        )}

        {/* Статус */}
        <div className="absolute top-3 right-3">
          <span className={`status-badge ${status.class}`}>
            {status.label}
          </span>
        </div>

        {/* Градиент поверх фото */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#12121a] to-transparent" />
      </div>

      {/* Информация */}
      <div className="p-5 space-y-4">
        {/* Название и тип */}
        <div>
          <h2 className="text-xl font-bold text-white mb-1">
            {equipment.name || 'Без названия'}
          </h2>
          <p className="text-sm text-cyan-400/80 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            {typeName}
          </p>
        </div>

        {/* ИНН */}
        <div className="info-block flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
            <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider">Инвентарный номер</p>
            <p className="font-mono font-semibold text-white">{equipment.inn}</p>
          </div>
        </div>

        {/* Местоположение */}
        <div className="info-block flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider">Местоположение</p>
            <p className="font-medium text-white">{location}</p>
          </div>
        </div>

        {/* Характеристики */}
        {equipment.specs && Object.keys(equipment.specs).length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Характеристики</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(equipment.specs).map(([key, value]) => {
                const displayValue = typeof value === 'object' ? value.value : value;
                const displayName = typeof value === 'object' ? value.display : key;
                return (
                  <div key={key} className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                    <p className="text-xs text-slate-500 mb-1">{displayName}</p>
                    <p className="text-sm font-medium text-slate-200">{displayValue}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Описание */}
        {equipment.description && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h7" />
              </svg>
              <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Описание</h3>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">{equipment.description}</p>
          </div>
        )}

        {/* Дата создания */}
        <div className="pt-4 border-t border-slate-800 flex justify-between text-sm">
          <span className="text-slate-500">
            <span className="text-slate-600">Добавлено:</span> {formatDate(equipment.created_at)}
          </span>
          {author && (
            <span className="text-slate-400">
              {author.first_name} {author.last_name}
            </span>
          )}
        </div>
      </div>

      {/* Кнопка сканировать снова */}
      <div className="px-5 pb-5">
        <button
          onClick={onScanAgain}
          className="neon-button w-full flex items-center justify-center gap-3"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
          </svg>
          <span>Сканировать ещё</span>
        </button>
      </div>
    </div>
  );
};

export default EquipmentCard;
