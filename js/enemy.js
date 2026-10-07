/**
 * enemy.js — 障礙物（車輛）與平台（浮木）生成、更新及碰撞判定
 *
 * 匯出：
 *   Entity          類別 — 通用移動實體（車/木）
 *   entities        陣列 — 當前關卡所有實體（live binding）
 *   initLevel       函式 — 初始化關卡（重設尺寸、速度、生成車/木）
 *   checkCollisions 函式 — 碰撞判定，透過 callback 觸發 gameOver
 */

import { ctx, canvas, GRID_SIZE, state, CAR_COLORS, LOG_COLOR } from './config.js';
import { frog, clearParticles } from './player.js';

// ─── 實體類別 ────────────────────────────────────────────────────────────────

export class Entity {
    /**
     * @param {number}  x      - 初始 X 座標
     * @param {number}  y      - 初始 Y 座標
     * @param {number}  w      - 寬度（像素）
     * @param {number}  h      - 高度（像素）
     * @param {number}  speed  - 每影格移動量（正 = 右移，負 = 左移）
     * @param {string}  color  - 填色
     * @param {boolean} isLog  - true = 浮木，false = 車輛
     */
    constructor(x, y, w, h, speed, color, isLog) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.speed = speed;
        this.color = color;
        this.isLog = isLog;
    }

    /** 依 speedMultiplier 移動，超出邊界時從另一側重入。 */
    update() {
        this.x += this.speed * state.speedMultiplier;
        if (this.speed > 0 && this.x > state.width + 50) {
            this.x = -this.w - 50;
        } else if (this.speed < 0 && this.x < -this.w - 50) {
            this.x = state.width + 50;
        }
    }

    draw() {
        ctx.fillStyle = this.color;
        if (this.isLog) {
            // 浮木本體
            ctx.fillRect(this.x, this.y + 4, this.w, this.h - 8);
            // 木紋線條
            ctx.fillStyle = '#5C4033';
            ctx.fillRect(this.x + 5, this.y + 10, this.w - 10, 4);
        } else {
            // 車身
            ctx.fillRect(this.x, this.y + 6, this.w, this.h - 12);
            // 車窗（依行進方向決定位置）
            ctx.fillStyle = '#87CEEB';
            if (this.speed > 0) {
                ctx.fillRect(this.x + this.w - 15, this.y + 10, 10, this.h - 20);
            } else {
                ctx.fillRect(this.x + 5, this.y + 10, 10, this.h - 20);
            }
        }
    }
}

// ─── 實體列表（live binding，game.js 讀取時永遠是最新陣列）─────────────────
export let entities = [];

// ─── 關卡初始化 ──────────────────────────────────────────────────────────────

/**
 * 根據 state.level 重新計算行列數、速度倍率，
 * 生成車輛與浮木，並重置青蛙位置。
 */
export function initLevel() {
    entities = [];
    clearParticles();

    // 動態行數（隨關卡增加）
    state.waterRows = 4 + state.level;
    state.roadRows  = 4 + state.level;
    state.rows      = 1 + state.waterRows + 1 + state.roadRows + 1;

    // 更新畫布高度
    canvas.height = state.rows * GRID_SIZE;
    state.height  = canvas.height;

    // 關卡速度倍率
    state.speedMultiplier = 1 + (state.level - 1) * 0.1;

    // 重置青蛙
    frog.reset();

    // ── 生成車輛（道路區域）────────────────────────────────────────────────
    const roadStartRow = state.waterRows + 2;
    for (let i = 0; i < state.roadRows; i++) {
        const y     = (roadStartRow + i) * GRID_SIZE;
        const dir   = (i % 2 === 0) ? -1 : 1;
        const speed = dir * (1.2 + Math.random() * 2);
        const color = CAR_COLORS[i % CAR_COLORS.length];

        const numCars = 2 + Math.floor(Math.random() * 2);
        const spacing = state.width / numCars;

        for (let j = 0; j < numCars; j++) {
            const x = j * spacing + Math.random() * 40;
            const w = 40 + Math.floor(Math.random() * 2) * 40; // 40 or 80
            entities.push(new Entity(x, y, w, GRID_SIZE, speed, color, false));
        }
    }

    // ── 生成浮木（水域區域）────────────────────────────────────────────────
    const waterStartRow = 1;
    for (let i = 0; i < state.waterRows; i++) {
        const y     = (waterStartRow + i) * GRID_SIZE;
        const dir   = (i % 2 === 0) ? 1 : -1;
        const speed = dir * (1.0 + Math.random() * 1.5);

        const numLogs = 2 + Math.floor(Math.random() * 2);
        const spacing = state.width / numLogs;

        for (let j = 0; j < numLogs; j++) {
            const x = j * spacing + Math.random() * 40;
            const w = 80 + Math.floor(Math.random() * 3) * 40; // 80, 120, or 160
            entities.push(new Entity(x, y, w, GRID_SIZE, speed, LOG_COLOR, true));
        }
    }
}

// ─── 碰撞判定 ────────────────────────────────────────────────────────────────

/**
 * 每影格執行碰撞判定。
 *   - 碰到車輛          → 呼叫 onGameOver('car')
 *   - 在水中且未踩浮木  → 呼叫 onGameOver('water')
 *   - 踩在浮木上        → 青蛙隨浮木漂移
 *   - 漂出畫面邊界      → 呼叫 onGameOver('water')
 *
 * @param {function(string): void} onGameOver - 死亡時的回呼函式
 */
export function checkCollisions(onGameOver) {
    const frogHitbox = {
        left:    frog.x + 8,
        right:   frog.x + frog.size - 8,
        top:     frog.y + 8,
        bottom:  frog.y + frog.size - 8,
        centerX: frog.x + frog.size / 2
    };

    let onLog    = false;
    let logSpeed = 0;

    for (const ent of entities) {
        const isOverlapping = !(
            frogHitbox.right  < ent.x       ||
            frogHitbox.left   > ent.x + ent.w ||
            frogHitbox.bottom < ent.y       ||
            frogHitbox.top    > ent.y + ent.h
        );

        if (isOverlapping) {
            if (!ent.isLog) {
                // 被車撞
                onGameOver('car');
                return;
            } else {
                // 踩在浮木上（以中心點確認）
                if (frogHitbox.centerX >= ent.x && frogHitbox.centerX <= ent.x + ent.w) {
                    onLog    = true;
                    logSpeed = ent.speed * state.speedMultiplier;
                }
            }
        }
    }

    // 水域範圍判斷
    const waterTop    = GRID_SIZE;
    const waterBottom = state.waterRows * GRID_SIZE + (GRID_SIZE - 1);
    if (frog.y >= waterTop && frog.y <= waterBottom) {
        if (!onLog) {
            onGameOver('water');
        } else {
            // 隨浮木漂移
            frog.x += logSpeed;
        }
    }

    // 漂出左右邊界
    if (frog.x < 0 || frog.x + frog.size > state.width) {
        onGameOver('water');
    }
}
