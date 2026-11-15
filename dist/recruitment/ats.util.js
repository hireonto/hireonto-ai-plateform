"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scoreAtsResume = scoreAtsResume;
exports.contentHash = contentHash;
const crypto_1 = require("crypto");
function scoreAtsResume(text) {
    const t = (text || '').trim();
    if (!t)
        return { score: 0, atsFriendly: false };
    let score = 40;
    const lower = t.toLowerCase();
    const sections = ['experience', 'education', 'skills', 'projects', 'summary'];
    for (const s of sections) {
        if (lower.includes(s))
            score += 8;
    }
    if (/\b[\w.+-]+@[\w-]+\.[\w.-]+\b/.test(t))
        score += 10;
    if (/\b\d{10}\b|\+\d{10,}/.test(t))
        score += 5;
    if (t.length > 800)
        score += 10;
    if (t.length > 2000)
        score += 5;
    if (/[•●▪◦]/.test(t) || /^\s*[-*]\s/m.test(t))
        score += 5;
    const capped = Math.min(100, Math.max(0, score));
    return { score: capped, atsFriendly: capped >= 65 };
}
function contentHash(text) {
    return (0, crypto_1.createHash)('sha256').update(text.trim().toLowerCase()).digest('hex').slice(0, 32);
}
//# sourceMappingURL=ats.util.js.map