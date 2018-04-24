function hitTestPoint(pointX, pointY, sprite) {
    var hit = false;
    if (pointX > sprite.left() &&
        pointX < sprite.right() &&
        pointY > sprite.top() &&
        pointY < sprite.bottom()) {
        hit = true;
    }
    return hit;
}

function hitTestCircle(c1, c2) {
    //Вычисление ширины и высоты вектора
    var vx = c1.centerX() - c2.centerX();
    var vy = c1.centerY() - c2.centerY();
    //Вычисление длины вектора (расстояния между кругами)
    var magnitude = Math.sqrt(vx * vx + vy * vy);
    //Вычисление общего радиуса
    var totalRadii = c1.halfWidth() + c2.halfWidth();
    //Установка hit в true, если длина вектора меньше totalRadii
    var hit = magnitude < totalRadii;
    return hit;
}

function blockCircle(c1, c2) {
    //Вычисление ширины и высоты вектора
    var vx = c1.centerX() - c2.centerX();
    var vy = c1.centerY() - c2.centerY();
    //Вычисление длины вектора (расстояния между кругами)
    var magnitude = Math.sqrt(vx * vx + vy * vy);
    //Вычисление общего радиуса
    var totalRadii = c1.halfWidth() + c2.halfWidth();
    //Обнаружение пересечения
    if (magnitude < totalRadii) {
        //Перекрытие произошло
        //Расчет величины перекрытия
        var overlap = totalRadii - magnitude;
        //Нормализация вектора (определение направления столкновения)
        dx = vx / magnitude;
        dy = vy / magnitude;
        //Вывод первого круга из области перекрытия
        c1.x += overlap * dx;
        c1.y += overlap * dy;
    }
}

function hitTestRectangle(r1, r2) {
    //Переменная для обнаружения факта пересечения спрайтов
    var hit = false;
    //Вычисление ширины и высоты вектора
    var vx = r1.centerX() - r2.centerX();
    var vy = r1.centerY() - r2.centerY();
    //Вычисление полуширины и полувысоты
    var combinedHalfWidths = r1.halfWidth() + r2.halfWidth();
    var combinedHalfHeights = r1.halfHeight() + r2.halfHeight();

    //Проверка условия пересечения по оси X
    if (Math.abs(vx) < combinedHalfWidths) {
        //Пересечение возможно. Проверка условия пересечения по оси Y
        if (Math.abs(vy) < combinedHalfHeights) {
            //Пересечение есть
            hit = true;
        } else {
            //По оси Y нет пересечения
            hit = false;
        }
    } else {
        //По оси X нет пересечения
        hit = false;
    }
    return hit;
}

function blockRectangle(r1, r2) {
    //Переменная, сообщающая нам, с какой стороны спрайта
    //происходит столкновение
    var collisionSide = "";
    //Вычисление ширины и высоты вектора
    var vx = r1.centerX() - r2.centerX();
    var vy = r1.centerY() - r2.centerY();
    //Вычисление полуширины и полувысоты
    var combinedHalfWidths = r1.halfWidth() + r2.halfWidth();
    var combinedHalfHeights = r1.halfHeight() + r2.halfHeight();
    //Проверка условия перекрытия спрайтов по оси X
    if (Math.abs(vx) < combinedHalfWidths) {
        //Перекрытие возможно. Проверка условия перекрытия по оси Y
        if (Math.abs(vy) < combinedHalfHeights) {
            //Перекрытие есть! Определим его величину по осям X и Y
            var overlapX = combinedHalfWidths - Math.abs(vx);
            var overlapY = combinedHalfHeights - Math.abs(vy);
            //Выясним, по какой оси перекрытие является наименьшим
            if (overlapX >= overlapY) {
                //Перекрытие произошло по оси X, но с какой стороны?
                if (vy > 0) {
                    collisionSide = "top";

                    r1.y = r1.y + overlapY;
                } else {
                    collisionSide = "bottom";
                    r1.y = r1.y - overlapY;
                }
            } else {
                //Перекрытие произошло по оси Y, но с какой стороны?
                if (vx > 0) {
                    collisionSide = "left";
                    r1.x = r1.x + overlapX;
                } else {
                    collisionSide = "right";
                    r1.x = r1.x - overlapX;
                }
            }
        } else {
            //По оси Y нет перекрытия
            collisionSide = "none";
        }
    } else {
        //По оси X нет перекрытия
        collisionSide = "none";
    }
    return collisionSide;
}
