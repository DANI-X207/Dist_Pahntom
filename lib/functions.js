const axios = require('axios');
const yts = require('yt-search');

// ── Clé API Groq (GRATUIT sur console.groq.com) ───────────────────────────────
// 1. Va sur https://console.groq.com
// 2. Crée un compte gratuit
// 3. API Keys → Create API Key
// 4. Colle ta clé ici
const GROQ_KEY = process.env.GROQ_API_KEY || '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';

/**
 * Pose une question à Groq (llama3 gratuit) — réponse directe et concise.
 */
const SYSTEM_PROMPT = [
    'Tu es Phantom Bot, un assistant WhatsApp au style Danny Phantom.',
    'Réponds TOUJOURS en français, de façon COURTE et DIRECTE.',
    'Si c\'est une traduction : donne juste le mot + un exemple d\'utilisation.',
    'Si c\'est du code : donne un exemple court et fonctionnel.',
    'Si c\'est une définition ou un concept : explique en 2-3 phrases max.',
    'Pour les faits simples : une seule phrase suffit.',
    'N\'utilise pas de ** ni de ## ni de markdown complexe.',
    'Maximum 10 lignes de réponse.'
].join(' ');

/**
 * Pose une question à Groq (llama3 gratuit) — réponse directe et concise.
 */
const askAI = async (question) => {
    if (!GROQ_KEY || GROQ_KEY === 'METS_TA_CLÉ_GROQ_ICI') {
        console.warn('[askAI] Clé Groq manquante — fallback DuckDuckGo');
        return null;
    }
    try {
        const { data } = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model: 'llama-3.1-8b-instant',
                max_tokens: 400,
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: question }
                ]
            },
            {
                headers: {
                    'Authorization': `Bearer ${GROQ_KEY}`,
                    'Content-Type': 'application/json'
                },
                timeout: 15000
            }
        );
        return data?.choices?.[0]?.message?.content?.trim() || null;
    } catch (e) {
        console.error('[askAI] Erreur Groq :', e.response?.data || e.message);
        return null;
    }
};

/**
 * Envoie une conversation complète (historique) à Groq.
 * @param {Array<{role: 'user'|'assistant', content: string}>} history
 */
const askAIWithHistory = async (history) => {
    if (!GROQ_KEY || GROQ_KEY === 'METS_TA_CLÉ_GROQ_ICI') return null;
    try {
        const { data } = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model: 'llama-3.1-8b-instant',
                max_tokens: 500,
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    ...history
                ]
            },
            {
                headers: {
                    'Authorization': `Bearer ${GROQ_KEY}`,
                    'Content-Type': 'application/json'
                },
                timeout: 15000
            }
        );
        return data?.choices?.[0]?.message?.content?.trim() || null;
    } catch (e) {
        console.error('[askAIWithHistory] Erreur Groq :', e.response?.data || e.message);
        return null;
    }
};

/**
 * Fallback DuckDuckGo si l'IA échoue.
 */
const duckSearch = async (query) => {
    try {
        const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_redirect=1&no_html=1&skip_disambig=1`;
        const { data } = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PhantomBot/2.0)' },
            timeout: 8000
        });

        const results = [];

        if (data.AbstractText && data.AbstractURL) {
            results.push({
                title: data.Heading || query,
                link: data.AbstractURL,
                snippet: data.AbstractText
            });
        }

        for (const topic of (data.RelatedTopics || [])) {
            if (results.length >= 3) break;
            if (topic.Text && topic.FirstURL) {
                results.push({ title: topic.Text.slice(0, 60), link: topic.FirstURL, snippet: topic.Text });
            }
            for (const sub of (topic.Topics || [])) {
                if (results.length >= 3) break;
                if (sub.Text && sub.FirstURL) {
                    results.push({ title: sub.Text.slice(0, 60), link: sub.FirstURL, snippet: sub.Text });
                }
            }
        }

        if (results.length === 0) {
            results.push({
                title: `Recherche : "${query}"`,
                link: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
                snippet: 'Voir les résultats complets en ligne.'
            });
        }

        return results;
    } catch (e) {
        console.error('[duckSearch] Erreur :', e.message);
        return null;
    }
};

/**
 * Recherche YouTube — retourne la première vidéo trouvée.
 */
const youtubeSearch = async (query) => {
    try {
        const result = await yts(query);
        const videos = result.videos;
        if (!videos?.length) return null;
        const v = videos[0];
        return {
            title: v.title,
            url: v.url,
            thumbnail: v.thumbnail,
            timestamp: v.timestamp,
            author: v.author?.name || 'Inconnu'
        };
    } catch (e) {
        console.error('[youtubeSearch] Erreur :', e.message);
        return null;
    }
};

module.exports = { askAI, askAIWithHistory, duckSearch, youtubeSearch };
