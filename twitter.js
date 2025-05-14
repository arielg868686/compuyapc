const { TwitterApi } = require('twitter-api-v2');
const MediaStorageService = require('./services/MediaStorageService');

class TwitterIntegrator {
    constructor(accessToken) {
        this.client = new TwitterApi(accessToken);
        this.mediaStorage = new MediaStorageService();
        this.initialized = !!accessToken;
    }

    async init(accessToken) {
        if (accessToken) {
            this.client = new TwitterApi(accessToken);
            this.initialized = true;
        }
    }

    async publishTweet(content, media = []) {
        this._checkInitialized();

        try {
            let mediaIds = [];
            
            // Subir medios si existen
            if (media.length > 0) {
                mediaIds = await Promise.all(
                    media.map(async (mediaPath) => {
                        const mediaUrl = await this.mediaStorage.uploadImage(mediaPath);
                        const mediaId = await this.client.v1.uploadMedia(mediaUrl);
                        return mediaId;
                    })
                );
            }

            // Publicar tweet
            const tweet = await this.client.v2.tweet({
                text: content,
                media: mediaIds.length > 0 ? { media_ids: mediaIds } : undefined
            });

            return tweet;
        } catch (error) {
            console.error('Error al publicar tweet:', error);
            throw error;
        }
    }

    async publishThread(tweets) {
        this._checkInitialized();

        try {
            const thread = await this.client.v2.tweetThread(tweets);
            return thread;
        } catch (error) {
            console.error('Error al publicar hilo:', error);
            throw error;
        }
    }

    async replyToTweet(tweetId, content, media = []) {
        this._checkInitialized();

        try {
            let mediaIds = [];
            
            if (media.length > 0) {
                mediaIds = await Promise.all(
                    media.map(async (mediaPath) => {
                        const mediaUrl = await this.mediaStorage.uploadImage(mediaPath);
                        const mediaId = await this.client.v1.uploadMedia(mediaUrl);
                        return mediaId;
                    })
                );
            }

            const reply = await this.client.v2.reply(
                content,
                tweetId,
                mediaIds.length > 0 ? { media_ids: mediaIds } : undefined
            );

            return reply;
        } catch (error) {
            console.error('Error al responder tweet:', error);
            throw error;
        }
    }

    async getTweetStats(tweetId) {
        this._checkInitialized();

        try {
            const tweet = await this.client.v2.singleTweet(tweetId, {
                'tweet.fields': ['public_metrics', 'created_at']
            });
            return tweet.data;
        } catch (error) {
            console.error('Error al obtener estadísticas del tweet:', error);
            throw error;
        }
    }

    async searchTweets(query, options = {}) {
        this._checkInitialized();

        try {
            const tweets = await this.client.v2.search(query, options);
            return tweets;
        } catch (error) {
            console.error('Error al buscar tweets:', error);
            throw error;
        }
    }

    _checkInitialized() {
        if (!this.initialized) {
            throw new Error('Twitter no está inicializado');
        }
    }
}

module.exports = TwitterIntegrator; 