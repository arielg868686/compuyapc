const TelegramBot = require('node-telegram-bot-api');
const MediaStorageService = require('./services/MediaStorageService');

class TelegramIntegrator {
    constructor(botToken) {
        this.bot = new TelegramBot(botToken, { polling: false });
        this.mediaStorage = new MediaStorageService();
        this.initialized = !!botToken;
    }

    async init(botToken) {
        if (botToken) {
            this.bot = new TelegramBot(botToken, { polling: false });
            this.initialized = true;
        }
    }

    async sendMessage(channelId, content, options = {}) {
        this._checkInitialized();

        try {
            const message = await this.bot.sendMessage(channelId, content, {
                parse_mode: 'HTML',
                ...options
            });
            return message;
        } catch (error) {
            console.error('Error al enviar mensaje:', error);
            throw error;
        }
    }

    async sendPhoto(channelId, photoPath, caption = '', options = {}) {
        this._checkInitialized();

        try {
            const photoUrl = await this.mediaStorage.uploadImage(photoPath);
            const message = await this.bot.sendPhoto(channelId, photoUrl, {
                caption,
                parse_mode: 'HTML',
                ...options
            });
            return message;
        } catch (error) {
            console.error('Error al enviar foto:', error);
            throw error;
        }
    }

    async sendVideo(channelId, videoPath, caption = '', options = {}) {
        this._checkInitialized();

        try {
            const videoUrl = await this.mediaStorage.uploadVideo(videoPath);
            const message = await this.bot.sendVideo(channelId, videoUrl, {
                caption,
                parse_mode: 'HTML',
                ...options
            });
            return message;
        } catch (error) {
            console.error('Error al enviar video:', error);
            throw error;
        }
    }

    async sendDocument(channelId, documentPath, caption = '', options = {}) {
        this._checkInitialized();

        try {
            const documentUrl = await this.mediaStorage.uploadImage(documentPath);
            const message = await this.bot.sendDocument(channelId, documentUrl, {
                caption,
                parse_mode: 'HTML',
                ...options
            });
            return message;
        } catch (error) {
            console.error('Error al enviar documento:', error);
            throw error;
        }
    }

    async sendMediaGroup(channelId, mediaItems) {
        this._checkInitialized();

        try {
            const media = await Promise.all(
                mediaItems.map(async (item) => {
                    const url = item.type === 'video' 
                        ? await this.mediaStorage.uploadVideo(item.path)
                        : await this.mediaStorage.uploadImage(item.path);

                    return {
                        type: item.type,
                        media: url,
                        caption: item.caption,
                        parse_mode: 'HTML'
                    };
                })
            );

            const messages = await this.bot.sendMediaGroup(channelId, media);
            return messages;
        } catch (error) {
            console.error('Error al enviar grupo de medios:', error);
            throw error;
        }
    }

    async getChannelInfo(channelId) {
        this._checkInitialized();

        try {
            const chat = await this.bot.getChat(channelId);
            return chat;
        } catch (error) {
            console.error('Error al obtener información del canal:', error);
            throw error;
        }
    }

    async getChannelStats(channelId) {
        this._checkInitialized();

        try {
            const chat = await this.bot.getChat(channelId);
            const stats = {
                title: chat.title,
                description: chat.description,
                memberCount: chat.member_count,
                type: chat.type
            };
            return stats;
        } catch (error) {
            console.error('Error al obtener estadísticas del canal:', error);
            throw error;
        }
    }

    _checkInitialized() {
        if (!this.initialized) {
            throw new Error('Telegram no está inicializado');
        }
    }
}

module.exports = TelegramIntegrator; 