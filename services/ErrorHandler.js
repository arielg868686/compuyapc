const fs = require('fs').promises;
const path = require('path');

class ErrorHandler {
    static async retry(operation, maxRetries = 3, delay = 1000) {
        let lastError;
        
        for (let i = 0; i < maxRetries; i++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error;
                console.error(`Intento ${i + 1} fallido:`, error);
                
                if (i < maxRetries - 1) {
                    await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
                }
            }
        }
        
        throw lastError;
    }

    static validateMedia(filePath) {
        const validImageTypes = ['.jpg', '.jpeg', '.png', '.gif'];
        const validVideoTypes = ['.mp4', '.mov', '.avi'];
        const maxImageSize = 10 * 1024 * 1024; // 10MB
        const maxVideoSize = 100 * 1024 * 1024; // 100MB

        const extension = path.extname(filePath).toLowerCase();
        const stats = fs.statSync(filePath);
        const fileSize = stats.size;

        if (validImageTypes.includes(extension)) {
            if (fileSize > maxImageSize) {
                throw new Error(`La imagen excede el tamaño máximo permitido (${maxImageSize / 1024 / 1024}MB)`);
            }
            return 'image';
        } else if (validVideoTypes.includes(extension)) {
            if (fileSize > maxVideoSize) {
                throw new Error(`El video excede el tamaño máximo permitido (${maxVideoSize / 1024 / 1024}MB)`);
            }
            return 'video';
        } else {
            throw new Error('Tipo de archivo no soportado');
        }
    }

    static async logError(error, context = {}) {
        const timestamp = new Date().toISOString();
        const errorLog = {
            timestamp,
            error: {
                message: error.message,
                stack: error.stack,
                name: error.name
            },
            context
        };

        const logFile = path.join(__dirname, '../logs/errors.json');
        
        try {
            let logs = [];
            try {
                const data = await fs.readFile(logFile, 'utf8');
                logs = JSON.parse(data);
            } catch (e) {
                // Si el archivo no existe o está vacío, empezamos con un array vacío
            }

            logs.push(errorLog);
            await fs.writeFile(logFile, JSON.stringify(logs, null, 2));
        } catch (e) {
            console.error('Error al guardar el log:', e);
        }
    }

    static async getErrorLogs(startDate, endDate) {
        const logFile = path.join(__dirname, '../logs/errors.json');
        
        try {
            const data = await fs.readFile(logFile, 'utf8');
            const logs = JSON.parse(data);
            
            return logs.filter(log => {
                const logDate = new Date(log.timestamp);
                return logDate >= startDate && logDate <= endDate;
            });
        } catch (error) {
            console.error('Error al leer los logs:', error);
            return [];
        }
    }

    static async clearErrorLogs() {
        const logFile = path.join(__dirname, '../logs/errors.json');
        
        try {
            await fs.writeFile(logFile, JSON.stringify([], null, 2));
        } catch (error) {
            console.error('Error al limpiar los logs:', error);
            throw error;
        }
    }
}

module.exports = ErrorHandler; 