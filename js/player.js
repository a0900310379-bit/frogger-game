/**
 * player.js — 玩家角色（青蛙）控制與狀態，以及物理粒子系統
 *
 * 匯出：
 *   Particle       類別 — 單一粒子
 *   particles      陣列 — 現存所有粒子（live binding，可從 game.js 讀取）
 *   frog           物件 — 玩家青蛙
 *   spawnParticles 函式 — 在指定位置產生粒子爆炸效果
 *   clearParticles 函式 — 清空所有粒子（關卡切換時使用）
 *   filterParticles 函式 — 移除已消滅的粒子（每影格呼叫）
 */

import { ctx, GRID_SIZE, COLS, state } from './config.js';

// ─── 物理粒子系統 ────────────────────────────────────────────────────────────

/** 目前畫面上所有粒子。使用 ES6 live binding，任何模組 import 後可見最新陣列。 */
export let particles = [];

export class Particle {
    /**
     * @param {number} x     - 生成中心 X 座標
     * @param {number} y     - 生成中心 Y 座標
     * @param {'car'|'water'} cause - 死亡原因，決定粒子顏色與物理行為
     */
    constructor(x, y, cause) {
        this.x = x;
        this.y = y;
        this.cause = cause;
        this.size = Math.random() * 5 + 2;
        this.vx = (Math.random() - 0.5) * 12;
        this.vy = (Math.random() - 0.5) * 12;
        this.life = 1.0;

        // 根據死因設定粒子顏色
        if (cause === 'car') {
            const colors = ['#FF0000', '#8B0000', '#32CD32']; // 血與青蛙碎片
            this.color = colors[Math.floor(Math.random() * colors.length)];
        } else {
            const colors = ['#E0FFFF', '#87CEFA', '#1E90FF']; // 水花
            this.color = colors[Math.floor(Math.random() * colors.length)];
            this.vy -= 3; // 落水有向上濺起的初速度
        }
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.cause === 'water') {
            this.vy += 0.5; // 水花有重力效果
        } else {
            this.vx *= 0.95; // 車禍碎片摩擦力減速
            this.vy *= 0.95;
        }

        this.life -= 0.02;
    }

    draw() {
        if (this.life <= 0) return;
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }
}

/**
 * 在指定位置一次性噴出 40 個粒子。
 * @param {number} x
 * @param {number} y
 * @param {'car'|'water'} cause
 */
export function spawnParticles(x, y, cause) {
    for (let i = 0; i < 40; i++) {
        particles.push(new Particle(x, y, cause));
    }
}

/** 清空所有粒子（關卡切換時呼叫）。 */
export function clearParticles() {
    particles = [];
}

/** 移除 life <= 0 的粒子（每影格主循環呼叫）。 */
export function filterParticles() {
    particles = particles.filter(p => p.life > 0);
}

// ─── 玩家青蛙物件 ────────────────────────────────────────────────────────────

export const frog = {
    x: 0,
    y: 0,
    size: GRID_SIZE,
    color: '#32CD32',
    isDead: false,

    /** 重置至畫面底部中央出發位置。 */
    reset() {
        this.x = Math.floor(COLS / 2) * GRID_SIZE;
        this.y = state.height - GRID_SIZE;
        this.isDead = false;
    },

    /** 繪製青蛙本體（死亡時隱藏，改畫粒子）。 */
    draw() {
        if (this.isDead) return;

        // 身體
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x + this.size / 2, this.y + this.size / 2, this.size / 2 - 4, 0, Math.PI * 2);
        ctx.fill();

        // 眼白
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(this.x + 8, this.y + 10, 4, 0, Math.PI * 2);
        ctx.arc(this.x + this.size - 8, this.y + 10, 4, 0, Math.PI * 2);
        ctx.fill();

        // 瞳孔
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(this.x + 8, this.y + 9, 2, 0, Math.PI * 2);
        ctx.arc(this.x + this.size - 8, this.y + 9, 2, 0, Math.PI * 2);
        ctx.fill();
    }
};
