/**
 * game.js — 遊戲主循環、狀態管理（開始 / 進行中 / 結束）、
 *            畫面繪製、按鍵輸入處理
 *
 * 匯出：
 *   gameLoop    函式 — requestAnimationFrame 主循環
 *   setupInput  函式 — 註冊鍵盤事件（main.js 呼叫一次）
 */

import { ctx, GRID_SIZE, state } from './config.js';
import { initAudio, playSound } from './audio.js';
import { frog, particles, spawnParticles, filterParticles } from './player.js';
import { entities, initLevel, checkCollisions } from './enemy.js';

// ─── 繪製背景 ────────────────────────────────────────────────────────────────

function drawBackground() {
    // 終點安全區（上方綠地）
    ctx.fillStyle = '#2E8B57';
    ctx.fillRect(0, 0, state.width, GRID_SIZE);

    // 水域
    ctx.fillStyle = '#104E8B';
    ctx.fillRect(0, GRID_SIZE, state.width, GRID_SIZE * state.waterRows);

    // 中間安全草地
    const safeRowY = (state.waterRows + 1) * GRID_SIZE;
    ctx.fillStyle = '#8FBC8F';
    ctx.fillRect(0, safeRowY, state.width, GRID_SIZE);

    // 道路
    const roadRowY = (state.waterRows + 2) * GRID_SIZE;
    ctx.fillStyle = '#444';
    ctx.fillRect(0, roadRowY, state.width, GRID_SIZE * state.roadRows);

    // 車道分隔線
    ctx.strokeStyle = '#999';
    ctx.setLineDash([15, 15]);
    ctx.beginPath();
    for (let i = state.waterRows + 3; i <= state.waterRows + 1 + state.roadRows; i++) {
        ctx.moveTo(0, i * GRID_SIZE);
        ctx.lineTo(state.width, i * GRID_SIZE);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // 起點安全草地（下方）
    const startRowY = (state.waterRows + 2 + state.roadRows) * GRID_SIZE;
    ctx.fillStyle = '#8FBC8F';
    ctx.fillRect(0, startRowY, state.width, GRID_SIZE);
}

// ─── 繪製 UI ─────────────────────────────────────────────────────────────────

function drawUI() {
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 20px Courier New';

    ctx.textAlign = 'left';
    ctx.fillText(`SCORE: ${state.score}`, 10, 28);

    ctx.textAlign = 'center';
    ctx.fillText(`LEVEL: ${state.level}`, state.width / 2, 28);

    ctx.textAlign = 'right';
    ctx.fillText(`HIGH: ${state.highScore}`, state.width - 10, 28);

    if (state.gameState === 'gameover') {
        // 半透明遮罩（讓底下粒子動畫仍微微可見）
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, state.width, state.height);

        ctx.fillStyle = '#FF3333';
        ctx.font = 'bold 48px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', state.width / 2, state.height / 2 - 20);

        ctx.fillStyle = '#FFF';
        ctx.font = '20px Courier New';
        ctx.fillText('按 [空白鍵] 重新開始', state.width / 2, state.height / 2 + 30);
    }
}

// ─── 達陣 ────────────────────────────────────────────────────────────────────

function reachGoal() {
    playSound('goal');
    state.score += 100 + (state.level * 20);
    if (state.score > state.highScore) {
        state.highScore = state.score;
        localStorage.setItem('froggerHighScore', state.highScore);
    }
    state.level++;
    initLevel();
}

// ─── 死亡（Game Over）────────────────────────────────────────────────────────

function gameOver(cause) {
    if (state.gameState === 'gameover') return;
    state.gameState = 'gameover';
    frog.isDead = true;

    const centerX = frog.x + frog.size / 2;
    const centerY = frog.y + frog.size / 2;

    if (cause === 'car') {
        playSound('crash');
        spawnParticles(centerX, centerY, 'car');
    } else {
        playSound('splash');
        spawnParticles(centerX, centerY, 'water');
    }
}

// ─── 主循環 ──────────────────────────────────────────────────────────────────

export function gameLoop() {
    ctx.clearRect(0, 0, state.width, state.height);

    drawBackground();

    // 更新並繪製實體
    entities.forEach(ent => {
        if (state.gameState === 'playing') ent.update();
        ent.draw();
    });

    // 碰撞判定與達陣偵測（僅遊戲進行中）
    if (state.gameState === 'playing') {
        checkCollisions(gameOver);
        if (frog.y === 0) reachGoal();
    }

    // 繪製青蛙
    frog.draw();

    // 更新並繪製粒子特效（Game Over 期間仍繼續播放動畫）
    particles.forEach(p => p.update());
    particles.forEach(p => p.draw());
    filterParticles();

    drawUI();

    requestAnimationFrame(gameLoop);
}

// ─── 鍵盤輸入 ────────────────────────────────────────────────────────────────

export function setupInput() {
    window.addEventListener('keydown', (e) => {
        // 確保瀏覽器允許播放音效
        initAudio();

        // 防止方向鍵捲動頁面
        if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
            e.preventDefault();
        }

        // Game Over → 按空白鍵重新開始
        if (state.gameState === 'gameover') {
            if (e.code === 'Space') {
                state.level = 1;
                state.score = 0;
                initLevel();
                state.gameState = 'playing';
            }
            return;
        }

        // 遊戲進行中 → 移動青蛙
        if (state.gameState === 'playing') {
            const step = GRID_SIZE;
            let moved = false;

            switch (e.code) {
                case 'ArrowUp':
                case 'KeyW':
                    if (frog.y - step >= 0) {
                        frog.y -= step;
                        state.score += 5; // 向前進加分
                        moved = true;
                    }
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    if (frog.y + step < state.height) {
                        frog.y += step;
                        moved = true;
                    }
                    break;
                case 'ArrowLeft':
                case 'KeyA':
                    if (frog.x - step >= 0) {
                        frog.x -= step;
                        moved = true;
                    }
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    if (frog.x + step <= state.width - frog.size) {
                        frog.x += step;
                        moved = true;
                    }
                    break;
            }

            if (moved) playSound('jump');
        }
    });
}
