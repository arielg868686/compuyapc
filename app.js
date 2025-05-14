// Configuración de Facebook
const FB_APP_ID = '673089075436781'; // App ID real de Facebook

// Inicialización de Facebook SDK
window.fbAsyncInit = function() {
    FB.init({
        appId: FB_APP_ID,
        cookie: true,
        xfbml: true,
        version: 'v18.0'
    });

    // Verificar estado de login
    FB.getLoginStatus(function(response) {
        console.log('Estado de login:', response);
        if (response.status === 'connected') {
            showMainPanel();
            loadGroups();
            loadCampaigns();
        }
    });
};

// Cargar Facebook SDK
(function(d, s, id) {
    var js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) return;
    js = d.createElement(s); js.id = id;
    js.src = "https://connect.facebook.net/es_LA/sdk.js";
    fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));

// Funciones de autenticación
function loginWithFacebook() {
    console.log('Iniciando login con Facebook...');
    FB.login(function(response) {
        console.log('Respuesta de login:', response);
        if (response.authResponse) {
            console.log('Login exitoso');
            showMainPanel();
            loadGroups();
            loadCampaigns();
        } else {
            console.log('Login cancelado o fallido');
            showError('No se pudo conectar con Facebook. Por favor, intenta de nuevo.');
        }
    }, {
        scope: 'public_profile,email,groups_access_member_info,pages_manage_posts,pages_read_engagement'
    });
}

function logout() {
    FB.logout(function(response) {
        showLoginPanel();
    });
}

// Funciones de UI
function showLoginPanel() {
    document.getElementById('loginPanel').style.display = 'block';
    document.getElementById('mainPanel').style.display = 'none';
}

function showMainPanel() {
    document.getElementById('loginPanel').style.display = 'none';
    document.getElementById('mainPanel').style.display = 'block';
    document.getElementById('mainPanel').classList.add('visible');
}

// Funciones de grupos
async function loadGroups() {
    try {
        const response = await FB.api('/me/groups', {
            fields: 'id,name,description,member_count'
        });

        const groupSelect = document.getElementById('groupSelect');
        groupSelect.innerHTML = '';

        response.data.forEach(group => {
            const option = document.createElement('option');
            option.value = group.id;
            option.textContent = `${group.name} (${group.member_count} miembros)`;
            groupSelect.appendChild(option);
        });
    } catch (error) {
        showError('Error al cargar grupos: ' + error.message);
    }
}

// Funciones de publicación
document.getElementById('postForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const content = document.getElementById('postContent').value;
    const groupIds = Array.from(document.getElementById('groupSelect').selectedOptions).map(opt => opt.value);
    const mediaFiles = document.getElementById('mediaFiles').files;

    try {
        const results = await postToGroups(content, groupIds, mediaFiles);
        showSuccess('Publicación completada');
        console.log('Resultados:', results);
    } catch (error) {
        showError('Error al publicar: ' + error.message);
    }
});

async function postToGroups(content, groupIds, mediaFiles) {
    const results = [];

    for (const groupId of groupIds) {
        try {
            const postData = {
                message: content
            };

            if (mediaFiles.length > 0) {
                const formData = new FormData();
                formData.append('source', mediaFiles[0]);
                formData.append('message', content);
                
                const response = await FB.api(`/${groupId}/photos`, 'POST', formData);
                results.push({
                    groupId,
                    success: true,
                    postId: response.id
                });
            } else {
                const response = await FB.api(`/${groupId}/feed`, 'POST', postData);
                results.push({
                    groupId,
                    success: true,
                    postId: response.id
                });
            }
        } catch (error) {
            results.push({
                groupId,
                success: false,
                error: error.message
            });
        }
    }

    return results;
}

// Funciones de búsqueda
document.getElementById('searchForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const location = document.getElementById('location').value;
    const radius = document.getElementById('radius').value;

    try {
        const results = await searchClientsByLocation(location, radius);
        displaySearchResults(results);
    } catch (error) {
        showError('Error en la búsqueda: ' + error.message);
    }
});

async function searchClientsByLocation(location, radius) {
    const results = {
        groups: [],
        pages: [],
        events: []
    };

    try {
        // Búsqueda de grupos
        const groupsResponse = await FB.api('/search', {
            q: `${location} grupos`,
            type: 'group',
            fields: 'id,name,description,member_count,location'
        });
        results.groups = groupsResponse.data;

        // Búsqueda de páginas
        const pagesResponse = await FB.api('/search', {
            q: `${location} negocios`,
            type: 'page',
            fields: 'id,name,category,location,fan_count'
        });
        results.pages = pagesResponse.data;

        // Búsqueda de eventos
        const eventsResponse = await FB.api('/search', {
            q: `${location} eventos`,
            type: 'event',
            fields: 'id,name,description,start_time,location'
        });
        results.events = eventsResponse.data;

        return results;
    } catch (error) {
        throw new Error('Error en la búsqueda: ' + error.message);
    }
}

function displaySearchResults(results) {
    const container = document.createElement('div');
    container.className = 'search-results';

    // Mostrar grupos
    if (results.groups.length > 0) {
        const groupsSection = document.createElement('div');
        groupsSection.innerHTML = `
            <h4>Grupos (${results.groups.length})</h4>
            <ul class="list-group">
                ${results.groups.map(group => `
                    <li class="list-group-item">
                        <h5>${group.name}</h5>
                        <p>${group.description || 'Sin descripción'}</p>
                        <small>${group.member_count} miembros</small>
                    </li>
                `).join('')}
            </ul>
        `;
        container.appendChild(groupsSection);
    }

    // Mostrar páginas
    if (results.pages.length > 0) {
        const pagesSection = document.createElement('div');
        pagesSection.innerHTML = `
            <h4>Páginas de Negocios (${results.pages.length})</h4>
            <ul class="list-group">
                ${results.pages.map(page => `
                    <li class="list-group-item">
                        <h5>${page.name}</h5>
                        <p>Categoría: ${page.category}</p>
                        <small>${page.fan_count} seguidores</small>
                    </li>
                `).join('')}
            </ul>
        `;
        container.appendChild(pagesSection);
    }

    // Mostrar eventos
    if (results.events.length > 0) {
        const eventsSection = document.createElement('div');
        eventsSection.innerHTML = `
            <h4>Eventos (${results.events.length})</h4>
            <ul class="list-group">
                ${results.events.map(event => `
                    <li class="list-group-item">
                        <h5>${event.name}</h5>
                        <p>${event.description || 'Sin descripción'}</p>
                        <small>Fecha: ${new Date(event.start_time).toLocaleDateString()}</small>
                    </li>
                `).join('')}
            </ul>
        `;
        container.appendChild(eventsSection);
    }

    // Reemplazar resultados anteriores
    const oldResults = document.querySelector('.search-results');
    if (oldResults) {
        oldResults.remove();
    }
    document.getElementById('searchForm').after(container);
}

// Funciones de campañas
document.getElementById('campaignForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const name = document.getElementById('campaignName').value;
    const objective = document.getElementById('campaignObjective').value;
    const budget = document.getElementById('campaignBudget').value;

    try {
        const campaignId = await createCampaign(name, objective, budget);
        showSuccess('Campaña creada con ID: ' + campaignId);
        loadCampaigns();
    } catch (error) {
        showError('Error al crear campaña: ' + error.message);
    }
});

async function createCampaign(name, objective, budget) {
    try {
        const response = await FB.api('/me/campaigns', 'POST', {
            name,
            objective,
            status: 'PAUSED',
            special_ad_categories: []
        });
        return response.id;
    } catch (error) {
        throw new Error('Error al crear campaña: ' + error.message);
    }
}

async function loadCampaigns() {
    try {
        const response = await FB.api('/me/campaigns', {
            fields: 'id,name,objective,status'
        });

        const tbody = document.querySelector('#campaignsTable tbody');
        tbody.innerHTML = '';

        response.data.forEach(campaign => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${campaign.name}</td>
                <td>${campaign.objective}</td>
                <td>${campaign.status}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="getCampaignStats('${campaign.id}')">
                        <i class="fas fa-chart-bar"></i> Estadísticas
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="updateCampaignStatus('${campaign.id}')">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        showError('Error al cargar campañas: ' + error.message);
    }
}

async function getCampaignStats(campaignId) {
    try {
        const response = await FB.api(`/${campaignId}/insights`, {
            fields: 'impressions,reach,clicks,spend'
        });

        const stats = response.data[0];
        showCampaignStats(stats);
    } catch (error) {
        showError('Error al obtener estadísticas: ' + error.message);
    }
}

function showCampaignStats(stats) {
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Estadísticas de la Campaña</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="campaign-stats">
                        <p><strong>Impresiones:</strong> ${stats.impressions}</p>
                        <p><strong>Alcance:</strong> ${stats.reach}</p>
                        <p><strong>Clics:</strong> ${stats.clicks}</p>
                        <p><strong>Gasto:</strong> $${stats.spend}</p>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();

    modal.addEventListener('hidden.bs.modal', function() {
        modal.remove();
    });
}

// Funciones de utilidad
function showSuccess(message) {
    const alert = document.createElement('div');
    alert.className = 'alert alert-success';
    alert.textContent = message;
    document.querySelector('.container').insertBefore(alert, document.querySelector('.card'));
    setTimeout(() => alert.remove(), 5000);
}

function showError(message) {
    const alert = document.createElement('div');
    alert.className = 'alert alert-danger';
    alert.textContent = message;
    document.querySelector('.container').insertBefore(alert, document.querySelector('.card'));
    setTimeout(() => alert.remove(), 5000);
} 