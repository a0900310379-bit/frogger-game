/**
 * main.js — 遊戲啟動入口
 *
 * 職責：
 *   1. 註冊鍵盤事件監聽器
 *   2. 初始化第一關
 *   3. 啟動主循環
 *
 * 此為 index.html 唯一載入的 JS 模組（type="module"）。
 */

import { initLevel } from './enemy.js';
import { gameLoop, setupInput } from './game.js';

// 註冊鍵盤輸入
setupInput();

// 初始化第一關（設定畫布大小、生成車/木、重置青蛙）
initLevel();

// 啟動 requestAnimationFrame 主循環
requestAnimationFrame(gameLoop);
