const cron = require('node-cron');
const fs = require('fs').promises;
const path = require('path');

class Scheduler {
    constructor() {
        this.scheduledPosts = new Map();
        this.scheduleFile = path.join(__dirname, '../data/scheduled_posts.json');
        this.loadScheduledPosts();
    }

    async loadScheduledPosts() {
        try {
            const data = await fs.readFile(this.scheduleFile, 'utf8');
            const posts = JSON.parse(data);
            posts.forEach(post => this.schedulePost(post));
        } catch (error) {
            console.error('Error al cargar publicaciones programadas:', error);
            // Si el archivo no existe, lo creamos
            await this.saveScheduledPosts();
        }
    }

    async saveScheduledPosts() {
        try {
            const posts = Array.from(this.scheduledPosts.values());
            await fs.writeFile(this.scheduleFile, JSON.stringify(posts, null, 2));
        } catch (error) {
            console.error('Error al guardar publicaciones programadas:', error);
            throw error;
        }
    }

    async schedulePost(post) {
        const { id, content, media, platforms, scheduleTime, timezone } = post;
        
        // Validar la fecha de programación
        const scheduleDate = new Date(scheduleTime);
        if (scheduleDate < new Date()) {
            throw new Error('La fecha de programación debe ser futura');
        }

        // Crear expresión cron
        const cronExpression = this._dateToCron(scheduleDate);
        
        // Programar la tarea
        const task = cron.schedule(cronExpression, async () => {
            try {
                // Publicar en las plataformas especificadas
                await this._publishToPlatforms(content, media, platforms);
                
                // Eliminar la tarea programada
                this.scheduledPosts.delete(id);
                await this.saveScheduledPosts();
                
                task.stop();
            } catch (error) {
                console.error('Error al publicar contenido programado:', error);
            }
        }, {
            timezone: timezone || 'UTC'
        });

        // Guardar la tarea
        this.scheduledPosts.set(id, {
            ...post,
            task
        });

        await this.saveScheduledPosts();
        return id;
    }

    async getScheduledPosts() {
        return Array.from(this.scheduledPosts.values()).map(post => ({
            id: post.id,
            content: post.content,
            media: post.media,
            platforms: post.platforms,
            scheduleTime: post.scheduleTime,
            timezone: post.timezone
        }));
    }

    async cancelScheduledPost(id) {
        const post = this.scheduledPosts.get(id);
        if (post) {
            post.task.stop();
            this.scheduledPosts.delete(id);
            await this.saveScheduledPosts();
            return true;
        }
        return false;
    }

    async updateScheduledPost(id, updates) {
        const post = this.scheduledPosts.get(id);
        if (post) {
            // Cancelar la tarea actual
            post.task.stop();
            
            // Crear nueva tarea con los updates
            const updatedPost = {
                ...post,
                ...updates
            };
            
            // Programar nueva tarea
            await this.schedulePost(updatedPost);
            return true;
        }
        return false;
    }

    _dateToCron(date) {
        const minutes = date.getMinutes();
        const hours = date.getHours();
        const dayOfMonth = date.getDate();
        const month = date.getMonth() + 1;
        const dayOfWeek = date.getDay();

        return `${minutes} ${hours} ${dayOfMonth} ${month} ${dayOfWeek}`;
    }

    async _publishToPlatforms(content, media, platforms) {
        // Esta función debe ser implementada para usar el SocialMediaIntegrator
        // y publicar en las plataformas especificadas
        const integrator = new (require('../index'))();
        return await integrator.publishToAll(content, media);
    }
}

module.exports = Scheduler; 