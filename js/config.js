/**
 * config.js — 遊戲設定常數與共享可變狀態
 *
 * 所有跨模組共享的狀態集中在 `state` 物件內，
 * 以物件參考傳遞確保各模組讀寫同一份資料。
 */

// --- 畫布基礎設定 ---
export const GRID_SIZE = 40;   // 每格像素大小
export const COLS = 13;         // 橫向格數

// --- 畫布與繪圖上下文 ---
export const canvas = document.getElementById('gameCanvas');
export const ctx = canvas.getContext('2d');

// --- 車輛與浮木顏色 ---
export const CAR_COLORS = ['#FF4500', '#FFD700', '#1E90FF', '#FF1493', '#FFFFFF'];
export const LOG_COLOR = '#8B4513';

/**
 * 可變遊戲狀態物件。
 * 使用物件而非散落的 let 變數，確保 ES6 模組間共享同一份參考。
 *
 * @property {number}  width           - 畫布寬度（像素）
 * @property {number}  height          - 畫布高度（像素，隨關卡動態變更）
 * @property {string}  gameState       - 'playing' | 'gameover'
 * @property {number}  level           - 當前關卡（1 起算）
 * @property {number}  score           - 當前分數
 * @property {number}  highScore       - 歷史最高分（持久化至 localStorage）
 * @property {number}  speedMultiplier - 關卡速度倍率
 * @property {number}  waterRows       - 水域列數
 * @property {number}  roadRows        - 道路列數
 * @property {number}  rows            - 總列數
 */
export const state = {
    width: canvas.width,
    height: canvas.height,
    gameState: 'playing',
    level: 1,
    score: 0,
    highScore: parseInt(localStorage.getItem('froggerHighScore') || '0', 10),
    speedMultiplier: 1,
    waterRows: 5,
    roadRows: 5,
    rows: 13
};
