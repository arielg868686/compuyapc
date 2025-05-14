const fb = require('fb');
const axios = require('axios');
const ErrorHandler = require('./services/ErrorHandler');

class FacebookBot {
    constructor() {
        this.initialized = false;
        this.groups = new Map();
        this.campaigns = new Map();
    }

    async initialize(accessToken) {
        try {
            fb.setAccessToken(accessToken);
            this.initialized = true;
            await this._loadGroups();
            await this._loadCampaigns();
        } catch (error) {
            throw new Error(`Error al inicializar Facebook Bot: ${error.message}`);
        }
    }

    async _loadGroups() {
        try {
            const response = await fb.api('/me/groups', { fields: 'id,name,description,member_count' });
            response.data.forEach(group => {
                this.groups.set(group.id, {
                    name: group.name,
                    description: group.description,
                    memberCount: group.member_count
                });
            });
        } catch (error) {
            ErrorHandler.logError(error, { context: 'Cargando grupos de Facebook' });
        }
    }

    async _loadCampaigns() {
        try {
            const response = await fb.api('/me/campaigns', { fields: 'id,name,objective,status' });
            response.data.forEach(campaign => {
                this.campaigns.set(campaign.id, {
                    name: campaign.name,
                    objective: campaign.objective,
                    status: campaign.status
                });
            });
        } catch (error) {
            ErrorHandler.logError(error, { context: 'Cargando campañas de Facebook' });
        }
    }

    // Publicación en grupos
    async postToGroups(content, media = null, groupIds = []) {
        this._checkInitialized();
        const results = [];

        const targetGroups = groupIds.length > 0 
            ? groupIds 
            : Array.from(this.groups.keys());

        for (const groupId of targetGroups) {
            try {
                const postData = {
                    message: content
                };

                if (media) {
                    postData.source = media;
                }

                const response = await fb.api(`/${groupId}/feed`, 'POST', postData);
                results.push({
                    groupId,
                    success: true,
                    postId: response.id
                });
            } catch (error) {
                results.push({
                    groupId,
                    success: false,
                    error: error.message
                });
                ErrorHandler.logError(error, { 
                    context: 'Publicando en grupo de Facebook',
                    groupId,
                    content
                });
            }
        }

        return results;
    }

    // Búsqueda de clientes por ubicación
    async searchClientsByLocation(location, radius = 10) {
        this._checkInitialized();
        try {
            // Búsqueda en grupos de la zona
            const groups = await this._searchGroupsByLocation(location, radius);
            
            // Búsqueda de páginas de negocios
            const pages = await this._searchPagesByLocation(location, radius);
            
            // Búsqueda de eventos
            const events = await this._searchEventsByLocation(location, radius);

            return {
                groups,
                pages,
                events
            };
        } catch (error) {
            ErrorHandler.logError(error, { 
                context: 'Buscando clientes por ubicación',
                location,
                radius
            });
            throw error;
        }
    }

    async _searchGroupsByLocation(location, radius) {
        const query = `${location} grupos`;
        try {
            const response = await fb.api('/search', {
                q: query,
                type: 'group',
                fields: 'id,name,description,member_count,location'
            });
            return response.data;
        } catch (error) {
            ErrorHandler.logError(error, { 
                context: 'Buscando grupos por ubicación',
                location,
                radius
            });
            return [];
        }
    }

    async _searchPagesByLocation(location, radius) {
        const query = `${location} negocios`;
        try {
            const response = await fb.api('/search', {
                q: query,
                type: 'page',
                fields: 'id,name,category,location,fan_count'
            });
            return response.data;
        } catch (error) {
            ErrorHandler.logError(error, { 
                context: 'Buscando páginas por ubicación',
                location,
                radius
            });
            return [];
        }
    }

    async _searchEventsByLocation(location, radius) {
        const query = `${location} eventos`;
        try {
            const response = await fb.api('/search', {
                q: query,
                type: 'event',
                fields: 'id,name,description,start_time,location'
            });
            return response.data;
        } catch (error) {
            ErrorHandler.logError(error, { 
                context: 'Buscando eventos por ubicación',
                location,
                radius
            });
            return [];
        }
    }

    // Gestión de campañas
    async createCampaign(name, objective, budget) {
        this._checkInitialized();
        try {
            const response = await fb.api('/me/campaigns', 'POST', {
                name,
                objective,
                status: 'PAUSED',
                special_ad_categories: []
            });

            const campaignId = response.id;
            this.campaigns.set(campaignId, {
                name,
                objective,
                status: 'PAUSED',
                budget
            });

            return campaignId;
        } catch (error) {
            ErrorHandler.logError(error, { 
                context: 'Creando campaña de Facebook',
                name,
                objective,
                budget
            });
            throw error;
        }
    }

    async updateCampaign(campaignId, updates) {
        this._checkInitialized();
        try {
            await fb.api(`/${campaignId}`, 'POST', updates);
            
            const campaign = this.campaigns.get(campaignId);
            this.campaigns.set(campaignId, {
                ...campaign,
                ...updates
            });

            return true;
        } catch (error) {
            ErrorHandler.logError(error, { 
                context: 'Actualizando campaña de Facebook',
                campaignId,
                updates
            });
            throw error;
        }
    }

    async getCampaignStats(campaignId) {
        this._checkInitialized();
        try {
            const response = await fb.api(`/${campaignId}/insights`, {
                fields: 'impressions,reach,clicks,spend'
            });
            return response.data;
        } catch (error) {
            ErrorHandler.logError(error, { 
                context: 'Obteniendo estadísticas de campaña',
                campaignId
            });
            throw error;
        }
    }

    // Métodos de utilidad
    _checkInitialized() {
        if (!this.initialized) {
            throw new Error('Facebook Bot no está inicializado');
        }
    }

    getGroups() {
        return Array.from(this.groups.entries());
    }

    getCampaigns() {
        return Array.from(this.campaigns.entries());
    }
}

module.exports = FacebookBot; 