/**
 * audio.js — Web Audio API 音效系統
 *
 * 以程序合成方式產生跳躍、車禍、落水、達陣四種音效，
 * 無需任何外部音訊檔案。
 *
 * 匯出：
 *   initAudio  函式 — 解鎖 AudioContext（首次使用者互動後呼叫）
 *   playSound  函式 — 播放指定類型音效
 */

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

/**
 * 解鎖被瀏覽器暫停的 AudioContext。
 * 必須在使用者互動（keydown / click）事件內呼叫。
 */
export function initAudio() {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

/**
 * 播放指定類型的合成音效。
 * @param {'jump'|'crash'|'splash'|'goal'} type
 */
export function playSound(type) {
    initAudio();

    const osc  = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    const now = audioCtx.currentTime;

    if (type === 'jump') {
        // 跳躍：正弦波頻率上升
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);

    } else if (type === 'crash') {
        // 車禍：低頻爆炸聲（方波頻率驟降）
        osc.type = 'square';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(10, now + 0.3);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);

    } else if (type === 'splash') {
        // 落水：三角波頻率快速變化的噗通聲
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.linearRampToValueAtTime(600, now + 0.1);
        osc.frequency.linearRampToValueAtTime(50, now + 0.3);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);

    } else if (type === 'goal') {
        // 達陣：兩段上升正弦音
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.setValueAtTime(600, now + 0.1);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
    }
}
