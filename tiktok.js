const axios = require('axios');

class TikTokIntegrator {
    constructor(accessToken) {
        this.accessToken = accessToken;
        this.apiBaseUrl = 'https://open.tiktokapis.com/v2';
        this.initialized = !!accessToken;
    }

    /**
     * Inicializa el integrador con un token de acceso
     * @param {string} accessToken - Token de acceso de TikTok
     */
    init(accessToken) {
        if (accessToken) {
            this.accessToken = accessToken;
            this.initialized = true;
        }
    }

    /**
     * Verifica si el integrador está inicializado
     * @returns {boolean} - Estado de inicialización
     */
    isInitialized() {
        return this.initialized;
    }

    /**
     * Obtiene información del usuario autenticado
     * @returns {Promise<Object>} - Datos del usuario
     */
    async getUserInfo() {
        this._checkInitialized();
        
        try {
            const response = await axios({
                method: 'GET',
                url: `${this.apiBaseUrl}/user/info/`,
                headers: this._getHeaders()
            });
            
            return response.data;
        } catch (error) {
            console.error('Error al obtener información del usuario de TikTok:', error.response?.data || error.message);
            throw new Error(`Error al obtener información del usuario: ${error.message}`);
        }
    }

    /**
     * Publica un video en TikTok
     * @param {string} videoUrl - URL pública del video a publicar
     * @param {string} caption - Texto descriptivo para el video
     * @returns {Promise<Object>} - Resultado de la publicación
     */
    async publishVideo(videoUrl, caption) {
        this._checkInitialized();
        
        try {
            // 1. Primero subimos el video
            const uploadResponse = await this._uploadVideo(videoUrl);
            
            // 2. Luego publicamos el video con el ID obtenido
            const publishResponse = await this._createPost(uploadResponse.video_id, caption);
            
            return publishResponse;
        } catch (error) {
            console.error('Error al publicar video en TikTok:', error.response?.data || error.message);
            throw new Error(`Error al publicar video: ${error.message}`);
        }
    }

    /**
     * Sube un video a TikTok
     * @param {string} videoUrl - URL pública del video
     * @returns {Promise<Object>} - Resultado de la subida
     * @private
     */
    async _uploadVideo(videoUrl) {
        try {
            // En una implementación real, aquí se haría la subida del video
            // usando la API de TikTok para subir videos
            const response = await axios({
                method: 'POST',
                url: `${this.apiBaseUrl}/video/upload/`,
                headers: this._getHeaders(),
                data: {
                    video_url: videoUrl
                }
            });
            
            return response.data;
        } catch (error) {
            throw new Error(`Error al subir video: ${error.message}`);
        }
    }

    /**
     * Crea una publicación con el video subido
     * @param {string} videoId - ID del video subido
     * @param {string} caption - Texto descriptivo
     * @returns {Promise<Object>} - Resultado de la publicación
     * @private
     */
    async _createPost(videoId, caption) {
        try {
            const response = await axios({
                method: 'POST',
                url: `${this.apiBaseUrl}/post/publish/`,
                headers: this._getHeaders(),
                data: {
                    video_id: videoId,
                    text: caption,
                    privacy_level: 'PUBLIC',
                    disable_comment: false,
                    disable_duet: false,
                    disable_stitch: false
                }
            });
            
            return response.data;
        } catch (error) {
            throw new Error(`Error al crear publicación: ${error.message}`);
        }
    }

    /**
     * Obtiene estadísticas de las publicaciones
     * @returns {Promise<Object>} - Estadísticas de publicaciones
     */
    async getPostStats() {
        this._checkInitialized();
        
        try {
            const response = await axios({
                method: 'GET',
                url: `${this.apiBaseUrl}/post/stats/`,
                headers: this._getHeaders()
            });
            
            return response.data;
        } catch (error) {
            console.error('Error al obtener estadísticas de TikTok:', error.response?.data || error.message);
            throw new Error(`Error al obtener estadísticas: ${error.message}`);
        }
    }

    /**
     * Verifica que el integrador esté inicializado
     * @private
     */
    _checkInitialized() {
        if (!this.initialized) {
            throw new Error('TikTok no está inicializado');
        }
    }

    /**
     * Genera los encabezados para las solicitudes a la API
     * @returns {Object} - Encabezados HTTP
     * @private
     */
    _getHeaders() {
        return {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
        };
    }

    /**
     * Obtiene URL pública de un video
     * @param {string} videoPath - Ruta local del video
     * @returns {Promise<string>} - URL pública del video
     */
    async getPublicVideoUrl(videoPath) {
        // TODO: Implementar subida de video a un servicio público
        return videoPath;
    }
}

module.exports = TikTokIntegrator;
