# Facebook Bot - Sistema de Integración

Sistema de integración para Facebook que permite publicar en grupos, buscar clientes y gestionar campañas publicitarias.

## Características

- Publicación en grupos de Facebook
- Búsqueda de clientes por ubicación
- Gestión de campañas publicitarias
- Interfaz web intuitiva
- Integración con Discord

## Requisitos

- Node.js 14.x o superior
- Cuenta de Facebook
- Aplicación de Facebook Developers

## Instalación

1. Clonar el repositorio:
```bash
git clone [URL_DEL_REPOSITORIO]
cd facebook-bot
```

2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno:
- Crear archivo `.env` en la raíz del proyecto
- Agregar las siguientes variables:
```
FACEBOOK_APP_ID=tu_app_id
FACEBOOK_APP_SECRET=tu_app_secret
DISCORD_BOT_TOKEN=tu_bot_token
```

4. Configurar la aplicación de Facebook:
- Crear una aplicación en [Facebook Developers](https://developers.facebook.com)
- Obtener el App ID y App Secret
- Configurar los dominios permitidos
- Agregar los permisos necesarios

## Uso

1. Iniciar el servidor web:
```bash
npm run web
```

2. Iniciar el bot de Discord:
```bash
npm run bot
```

3. Acceder a la interfaz web:
- Abrir http://localhost:3000 en el navegador
- Iniciar sesión con Facebook
- Comenzar a usar las funcionalidades

## Comandos de Discord

- `!social help`: Muestra la lista de comandos disponibles
- `!social post [plataforma] [contenido]`: Publica contenido en la plataforma especificada
- `!social schedule [plataforma] [fecha] [contenido]`: Programa una publicación
- `!social stats [plataforma]`: Muestra estadísticas de la plataforma

## Contribuir

1. Fork el repositorio
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles. 