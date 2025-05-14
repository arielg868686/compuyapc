const SocialMediaIntegrator = require('./index');

async function ejemploDeUso() {
    try {
        // Crear instancia del integrador
        const integrator = new SocialMediaIntegrator();

        // Contenido a publicar
        const contenido = "¡Nuevo producto disponible! 🎉\n\n" +
                         "Descripción del producto y sus características.\n" +
                         "Precio: $XXX\n" +
                         "¡No te lo pierdas!";

        // Rutas de las imágenes/videos
        const imagenes = [
            "./media/producto1.jpg",
            "./media/video1.mp4"
        ];

        // Publicar en todas las redes
        console.log('Iniciando publicación...');
        const resultados = await integrator.publishToAll(contenido, imagenes);
        
        // Mostrar resultados
        console.log('Resultados de la publicación:');
        console.log(JSON.stringify(resultados, null, 2));

    } catch (error) {
        console.error('Error en la publicación:', error);
    }
}

// Ejecutar el ejemplo
ejemploDeUso(); 