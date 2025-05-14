const { FB } = require('fb');

class InstagramIntegrator {
    constructor(pageToken) {
        this.pageToken = pageToken;
        FB.setAccessToken(pageToken);
    }

    // Obtener ID de Instagram conectado a la página de Facebook
    async getInstagramAccountId(pageId) {
        return new Promise((resolve, reject) => {
            FB.api(
                `/${pageId}`,
                'GET',
                { 
                    fields: 'instagram_business_account',
                    access_token: this.pageToken
                },
                (response) => {
                    if (response && !response.error) {
                        if (response.instagram_business_account) {
                            resolve(response.instagram_business_account.id);
                        } else {
                            reject(new Error('No se encontró cuenta de Instagram vinculada'));
                        }
                    } else {
                        reject(response.error);
                    }
                }
            );
        });
    }

    // Publicar imagen en Instagram
    async publishPhoto(instagramAccountId, imageUrl, caption) {
        try {
            // 1. Crear contenedor de medios
            const mediaContainer = await this.createMediaContainer(instagramAccountId, imageUrl, caption);
            
            // 2. Publicar el contenedor
            return await this.publishMediaContainer(instagramAccountId, mediaContainer.id);
        } catch (error) {
            console.error('Error al publicar en Instagram:', error);
            throw error;
        }
    }

    // Crear contenedor de medios
    async createMediaContainer(instagramAccountId, imageUrl, caption) {
        return new Promise((resolve, reject) => {
            FB.api(
                `/${instagramAccountId}/media`,
                'POST',
                {
                    image_url: imageUrl,
                    caption: caption,
                    access_token: this.pageToken
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

    // Publicar contenedor de medios
    async publishMediaContainer(instagramAccountId, mediaContainerId) {
        return new Promise((resolve, reject) => {
            FB.api(
                `/${instagramAccountId}/media_publish`,
                'POST',
                {
                    creation_id: mediaContainerId,
                    access_token: this.pageToken
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

    // Obtener URL pública de una imagen
    async getPublicImageUrl(imagePath) {
        // TODO: Implementar subida de imagen a un servicio público
        // Por ahora, asumimos que la imagen ya está en una URL pública
        return imagePath;
    }
}

module.exports = InstagramIntegrator;
