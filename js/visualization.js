let currentCoordinates = [];
let canvas, ctx;

// Инициализация при загрузке страницы
window.onload = function() {
    canvas = document.getElementById('coordinateCanvas');
    ctx = canvas.getContext('2d');
    
    console.info("L2J Coordinator JavaScript version initialized");
    
    loadSampleData();
};

// Генерация координат на основе входных параметров
function generateCoordinates() {
    try {
        const x1 = parseInt(document.getElementById('x1').value);
        const y1 = parseInt(document.getElementById('y1').value);
        const x2 = parseInt(document.getElementById('x2').value);
        const y2 = parseInt(document.getElementById('y2').value);
        const z = parseInt(document.getElementById('z').value);
        const heading = parseInt(document.getElementById('heading').value);
        const columnsPerRow = parseInt(document.getElementById('columnsPerRow').value);
        const rows = parseInt(document.getElementById('rows').value);

        // Валидация входных данных
        if (isNaN(x1) || isNaN(y1) || isNaN(x2) || isNaN(y2) || 
            isNaN(z) || isNaN(heading) || isNaN(columnsPerRow) || isNaN(rows)) {
            showError('Пожалуйста, заполните все поля корректными числовыми значениями');
            return;
        }

        if (columnsPerRow <= 0 || rows <= 0) {
            showError('Количество столбцов и строк должно быть больше 0');
            return;
        }

        showLoading(true);
        hideMessages();

        // Генерация координат
        setTimeout(() => {
            try {
                currentCoordinates = buildRectangleCoordinates(x1, y1, x2, y2, z, heading, columnsPerRow, rows);
                
                showLoading(false);
                showSuccess(`Сгенерировано ${currentCoordinates.length} координат`);
                
                visualizeGrid();
                displayCoordinates();
                
                console.info("Coordinates generated successfully:", currentCoordinates.length, "points");
            } catch (error) {
                console.error("Error generating coordinates:", error.message);
                showError(`Ошибка генерации координат: ${error.message}`);
                showLoading(false);
            }
        }, 500);

    } catch (error) {
        console.error("Error in generateCoordinates:", error.message);
        showError(`Ошибка: ${error.message}`);
        showLoading(false);
    }
}

// Построение координат прямоугольника
function buildRectangleCoordinates(x1, y1, x2, y2, z, heading, columnsPerRow, rows) {
    if (rows <= 0 || columnsPerRow <= 0) {
        throw new Error("Количество строк и столбцов должно быть положительным");
    }

    const coordinates = [];
    
    // Вычисляем длину базовой линии между точками
    const lineLength = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    
    // Высота прямоугольника равна длине базовой линии
    const rectangleHeight = lineLength;
    
    // Шаг между столбцами (вдоль базовой линии)
    const stepX = (columnsPerRow > 1) ? (x2 - x1) / (columnsPerRow - 1) : 0;
    const stepY = (columnsPerRow > 1) ? (y2 - y1) / (columnsPerRow - 1) : 0;
    
    // Шаг между строками (перпендикулярно базовой линии)
    const rowStepDistance = (rows > 1) ? rectangleHeight / (rows - 1) : 0;
    
    // Вычисляем перпендикулярный вектор (поворачиваем на 90° против часовой стрелки)
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    // Нормализованный перпендикулярный вектор (направлен вверх относительно линии)
    const perpX = (length > 0) ? -dy / length : 0;
    const perpY = (length > 0) ? dx / length : 1;
    
    console.log(`Base line: (${x1},${y1}) → (${x2},${y2})`);
    console.log(`Line length: ${lineLength.toFixed(2)}`);
    console.log(`Rectangle height: ${rectangleHeight.toFixed(2)}`);
    console.log(`Steps: column(${stepX.toFixed(2)}, ${stepY.toFixed(2)}), row distance: ${rowStepDistance.toFixed(2)}`);
    console.log(`Perpendicular vector: (${perpX.toFixed(3)}, ${perpY.toFixed(3)})`);

    // Строим сетку точек
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < columnsPerRow; col++) {
            // Позиция вдоль базовой линии (первая строка)
            const xAlongLine = x1 + col * stepX;
            const yAlongLine = y1 + col * stepY;
            
            // Смещение перпендикулярно линии для создания строк
            const rowOffset = row * rowStepDistance;
            const x = xAlongLine + perpX * rowOffset;
            const y = yAlongLine + perpY * rowOffset;

            coordinates.push({
                x: Math.round(x * 100) / 100, // Округляем до 2 знаков после запятой
                y: Math.round(y * 100) / 100,
                z: z,
                heading: heading
            });
        }
    }

    console.log(`Generated ${coordinates.length} coordinates`);
    return coordinates;
}

// Визуализация сетки на canvas
function visualizeGrid() {
    if (!currentCoordinates.length) return;

    // Очистка canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Настройка стилей
    ctx.strokeStyle = '#4facfe';
    ctx.fillStyle = '#4facfe';
    ctx.lineWidth = 2;
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';

    // Определение границ для масштабирования
    const minX = Math.min(...currentCoordinates.map(c => c.x));
    const maxX = Math.max(...currentCoordinates.map(c => c.x));
    const minY = Math.min(...currentCoordinates.map(c => c.y));
    const maxY = Math.max(...currentCoordinates.map(c => c.y));

    const padding = 50;
    const scaleX = (canvas.width - 2 * padding) / (maxX - minX || 1);
    const scaleY = (canvas.height - 2 * padding) / (maxY - minY || 1); // Исправлено: убрал минус
    const scale = Math.min(scaleX, scaleY);

    // Функция преобразования координат
    function transformX(x) {
        return padding + (x - minX) * scale;
    }

    function transformY(y) {
        return canvas.height - padding - (y - minY) * scale;
    }

    // Отрисовка осей
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, transformY(0));
    ctx.lineTo(canvas.width, transformY(0));
    ctx.moveTo(transformX(0), 0);
    ctx.lineTo(transformX(0), canvas.height);
    ctx.stroke();

    // Отрисовка исходной базовой линии
    const inputX1 = parseInt(document.getElementById('x1').value);
    const inputY1 = parseInt(document.getElementById('y1').value);
    const inputX2 = parseInt(document.getElementById('x2').value);
    const inputY2 = parseInt(document.getElementById('y2').value);
    
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(transformX(inputX1), transformY(inputY1));
    ctx.lineTo(transformX(inputX2), transformY(inputY2));
    ctx.stroke();
    
    // Отрисовка базовых точек
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(transformX(inputX1), transformY(inputY1), 8, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(transformX(inputX2), transformY(inputY2), 8, 0, 2 * Math.PI);
    ctx.fill();

    // Отрисовка сетки
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 0.5;
    for (let x = minX; x <= maxX; x += Math.max(1, Math.round((maxX - minX) / 20))) {
        ctx.beginPath();
        ctx.moveTo(transformX(x), 0);
        ctx.lineTo(transformX(x), canvas.height);
        ctx.stroke();
    }
    for (let y = minY; y <= maxY; y += Math.max(1, Math.round((maxY - minY) / 20))) {
        ctx.beginPath();
        ctx.moveTo(0, transformY(y));
        ctx.lineTo(canvas.width, transformY(y));
        ctx.stroke();
    }

    // Отрисовка точек координат
    ctx.fillStyle = '#4facfe';
    ctx.strokeStyle = '#2196f3';
    ctx.lineWidth = 2;

    currentCoordinates.forEach((coord, index) => {
        const x = transformX(coord.x);
        const y = transformY(coord.y);

        // Отрисовка точки
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();

        // Номер точки
        ctx.fillStyle = '#333';
        ctx.fillText(index + 1, x, y - 15);
        ctx.fillStyle = '#4facfe';
    });

    // Отрисовка линий сетки
    ctx.strokeStyle = '#4facfe';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);

    // Горизонтальные линии
    const uniqueY = [...new Set(currentCoordinates.map(c => c.y))].sort((a, b) => a - b);
    uniqueY.forEach(y => {
        const rowCoords = currentCoordinates.filter(c => c.y === y);
        if (rowCoords.length > 1) {
            ctx.beginPath();
            ctx.moveTo(transformX(rowCoords[0].x), transformY(y));
            ctx.lineTo(transformX(rowCoords[rowCoords.length - 1].x), transformY(y));
            ctx.stroke();
        }
    });

    // Вертикальные линии
    const uniqueX = [...new Set(currentCoordinates.map(c => c.x))].sort((a, b) => a - b);
    uniqueX.forEach(x => {
        const colCoords = currentCoordinates.filter(c => c.x === x);
        if (colCoords.length > 1) {
            ctx.beginPath();
            ctx.moveTo(transformX(x), transformY(colCoords[0].y));
            ctx.lineTo(transformX(x), transformY(colCoords[colCoords.length - 1].y));
            ctx.stroke();
        }
    });

    ctx.setLineDash([]);

    // Обновление информации о сетке
    updateGridInfo(minX, maxX, minY, maxY);
}

// Обновление информации о сетке
function updateGridInfo(minX, maxX, minY, maxY) {
    const gridInfo = document.getElementById('gridInfo');
    
    // Вычисляем размеры прямоугольника
    const width = Math.max(...currentCoordinates.map(c => c.x)) - Math.min(...currentCoordinates.map(c => c.x));
    const height = Math.max(...currentCoordinates.map(c => c.y)) - Math.min(...currentCoordinates.map(c => c.y));
    
    // Вычисляем длину исходной линии
    const inputX1 = parseInt(document.getElementById('x1').value);
    const inputY1 = parseInt(document.getElementById('y1').value);
    const inputX2 = parseInt(document.getElementById('x2').value);
    const inputY2 = parseInt(document.getElementById('y2').value);
    const lineLength = Math.sqrt(Math.pow(inputX2 - inputX1, 2) + Math.pow(inputY2 - inputY1, 2));
    
    gridInfo.innerHTML = `
        <p><strong>Исходная линия:</strong> (${inputX1},${inputY1}) → (${inputX2},${inputY2})</p>
        <p><strong>Длина линии:</strong> ${lineLength.toFixed(2)}</p>
        <p><strong>Размеры прямоугольника:</strong> ${width} × ${height}</p>
        <p><strong>Количество точек:</strong> ${currentCoordinates.length}</p>
        <p><strong>Диапазон X:</strong> ${minX} - ${maxX}</p>
        <p><strong>Диапазон Y:</strong> ${minY} - ${maxY}</p>
        <p><strong>Координата Z:</strong> ${currentCoordinates[0]?.z || 0}</p>
        <p><strong>Heading:</strong> ${currentCoordinates[0]?.heading || 0}°</p>
    `;
}

// Отображение списка координат
function displayCoordinates() {
    const coordinatesList = document.getElementById('coordinatesList');
    coordinatesList.innerHTML = '';

    currentCoordinates.forEach((coord, index) => {
        const coordItem = document.createElement('div');
        coordItem.className = 'coordinate-item';
        coordItem.innerHTML = `
            <span><strong>${index + 1}:</strong> X:${coord.x}, Y:${coord.y}, Z:${coord.z}, H:${coord.heading}°</span>
            <span style="color: #666;">ID: ${index}</span>
        `;
        coordinatesList.appendChild(coordItem);
    });
}

// Загрузка примера данных
function loadSampleData() {
    document.getElementById('x1').value = '1';
    document.getElementById('y1').value = '1';
    document.getElementById('x2').value = '5';
    document.getElementById('y2').value = '5';
    document.getElementById('z').value = '0';
    document.getElementById('heading').value = '0';
    document.getElementById('columnsPerRow').value = '5';
    document.getElementById('rows').value = '5';
    
    generateCoordinates();
}

// Очистка визуализации
function clearVisualization() {
    currentCoordinates = [];
    document.getElementById('visualizationSection').style.display = 'none';
    hideMessages();
    
    if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    
    console.debug("Visualization cleared");
}

// Переключение панели отладки
function toggleDebug() {
    const debugPanel = document.getElementById('debugPanel');
    const isVisible = debugPanel.style.display !== 'none';
    debugPanel.style.display = isVisible ? 'none' : 'block';
    
    if (!isVisible) {
        console.info("Debug panel shown");
    }
}

// Показать/скрыть загрузку
function showLoading(show) {
    document.getElementById('loading').style.display = show ? 'block' : 'none';
    if (show) {
        document.getElementById('visualizationSection').style.display = 'none';
    } else {
        document.getElementById('visualizationSection').style.display = 'block';
    }
}

// Показать ошибку
function showError(message) {
    const errorDiv = document.getElementById('error');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

// Показать успех
function showSuccess(message) {
    const successDiv = document.getElementById('success');
    successDiv.textContent = message;
    successDiv.style.display = 'block';
}

// Скрыть все сообщения
function hideMessages() {
    document.getElementById('error').style.display = 'none';
    document.getElementById('success').style.display = 'none';
}

// Экспорт координат в JSON
function exportToJson() {
    const dataStr = JSON.stringify(currentCoordinates, null, 2);
    
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'coordinates.json';
    link.click();
    URL.revokeObjectURL(url);
    
    console.info("Coordinates exported to JSON file");
}

// Добавляем кнопку экспорта в button-group
document.addEventListener('DOMContentLoaded', function() {
    const buttonGroup = document.querySelector('.button-group');
    const exportButton = document.createElement('button');
    exportButton.className = 'btn btn-secondary';
    exportButton.textContent = 'Экспорт JSON';
    exportButton.onclick = exportToJson;
    buttonGroup.appendChild(exportButton);
});
