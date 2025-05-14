const AWS = require('aws-sdk');
const cloudinary = require('cloudinary').v2;
const fs = require('fs').promises;
const path = require('path');

class MediaStorageService {
    constructor() {
        // Configurar AWS
        AWS.config.update({
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            region: process.env.AWS_REGION
        });
        this.s3 = new AWS.S3();

        // Configurar Cloudinary
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET
        });
    }

    async uploadImage(imagePath) {
        try {
            // Subir a Cloudinary para imágenes
            const result = await cloudinary.uploader.upload(imagePath, {
                resource_type: "image",
                folder: "social-media/images"
            });
            return result.secure_url;
        } catch (error) {
            console.error('Error al subir imagen:', error);
            throw error;
        }
    }

    async uploadVideo(videoPath) {
        try {
            // Subir a S3 para videos
            const fileContent = await fs.readFile(videoPath);
            const fileName = path.basename(videoPath);
            
            const params = {
                Bucket: process.env.AWS_S3_BUCKET,
                Key: `social-media/videos/${fileName}`,
                Body: fileContent,
                ContentType: 'video/mp4'
            };

            const result = await this.s3.upload(params).promise();
            return result.Location;
        } catch (error) {
            console.error('Error al subir video:', error);
            throw error;
        }
    }

    async getPublicUrl(fileId, type = 'image') {
        if (type === 'image') {
            return await cloudinary.url(fileId);
        } else {
            return `https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com/${fileId}`;
        }
    }

    async deleteMedia(fileId, type = 'image') {
        try {
            if (type === 'image') {
                await cloudinary.uploader.destroy(fileId);
            } else {
                await this.s3.deleteObject({
                    Bucket: process.env.AWS_S3_BUCKET,
                    Key: fileId
                }).promise();
            }
        } catch (error) {
            console.error('Error al eliminar medio:', error);
            throw error;
        }
    }
}

module.exports = MediaStorageService; 