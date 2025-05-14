require('dotenv').config();
const { FB } = require('fb');
const InstagramIntegrator = require('./instagram');
const TikTokIntegrator = require('./tiktok');

class SocialMediaIntegrator {
    constructor() {
        this.platforms = require('./config/platforms.json');
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;
        
        // Facebook
        if (process.env.FACEBOOK_PAGE_TOKEN_COMPUYAPC) {
            FB.setAccessToken(process.env.FACEBOOK_PAGE_TOKEN_COMPUYAPC);
            this.platforms.facebook.initialized = true;
        }

        // TikTok
        if (process.env.TIKTOK_TOKEN) {
            this.tikTokIntegrator = new TikTokIntegrator(process.env.TIKTOK_TOKEN);
            this.platforms.tiktok.initialized = true;
        }

        // Instagram (vía Facebook)
        if (this.platforms.facebook.initialized) {
            this.platforms.instagram.initialized = true;
        }

        // Twitter/X
        if (process.env.TWITTER_TOKEN) {
            this.platforms.twitter.initialized = true;
        }

        // Telegram
        if (process.env.TELEGRAM_BOT_TOKEN) {
            this.platforms.telegram.initialized = true;
        }

        this.initialized = true;
    }

    async publishToAll(content, images = []) {
        await this.init();
        const results = {
            facebook: [],
            tiktok: null,
            instagram: null,
            twitter: null,
            telegram: null
        };

        // Facebook
        if (this.platforms.facebook.initialized) {
            for (const [key, page] of Object.entries(this.platforms.facebook.pages)) {
                if (page.type === 'business') {
                    try {
                        const result = await this.publishToFacebook(page.id, content, images);
                        results.facebook.push({ page: key, success: true, result });
                    } catch (error) {
                        results.facebook.push({ page: key, success: false, error });
                    }
                }
            }
        }

        // TikTok
        if (this.platforms.tiktok.initialized && images.length > 0) {
            try {
                const videoUrl = await this.tikTokIntegrator.getPublicVideoUrl(images[0]);
                const result = await this.tikTokIntegrator.publishVideo(videoUrl, content);
                results.tiktok = { success: true, result };
            } catch (error) {
                results.tiktok = { success: false, error: error.message };
            }
        }

        // Instagram
        if (this.platforms.instagram.initialized && images.length > 0) {
            try {
                const instagram = new InstagramIntegrator(process.env.FACEBOOK_PAGE_TOKEN_COMPUYAPC);
                const pageId = this.platforms.facebook.pages.main.id;
                const instagramId = await instagram.getInstagramAccountId(pageId);
                const imageUrl = await instagram.getPublicImageUrl(images[0]);
                const result = await instagram.publishPhoto(instagramId, imageUrl, content);
                results.instagram = { success: true, result };
            } catch (error) {
                results.instagram = { success: false, error: error.message };
            }
        }

        return results;
    }

    async publishToFacebook(pageId, content, images = []) {
        if (!this.platforms.facebook.initialized) {
            throw new Error('Facebook no está inicializado');
        }

        const whatsappLink = this.generateWhatsAppLink();
        const fullContent = `${content}\n\n📱 Consultá por WhatsApp: ${whatsappLink}`;

        if (images.length > 0) {
            return new Promise((resolve, reject) => {
                FB.api(
                    `/${pageId}/photos`,
                    'POST',
                    {
                        source: images[0],
                        caption: fullContent,
                        published: true
                    },
                    (response) => {
                        if (response && !response.error) {
                            resolve(response);
                        } else {
                            reject(response.error);
                        }
                    }
                );
            });
        } else {
            return new Promise((resolve, reject) => {
                FB.api(
                    `/${pageId}/feed`,
                    'POST',
                    {
                        message: fullContent
                    },
                    (response) => {
                        if (response && !response.error) {
                            resolve(response);
                        } else {
                            reject(response.error);
                        }
                    }
                );
            });
        }
    }

    generateWhatsAppLink() {
        const { number, defaultMessage } = this.platforms.whatsapp.main;
        return `https://wa.me/${number}?text=${encodeURIComponent(defaultMessage)}`;
    }
}

module.exports = SocialMediaIntegrator;
