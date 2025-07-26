import winston from 'winston';
import 'winston-daily-rotate-file';

// Cấu hình transport để ghi log ra file theo ngày
const fileTransport = new winston.transports.DailyRotateFile({
    filename: 'logs/application-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true, // Nén các file log cũ để tiết kiệm dung lượng
    maxSize: '20m', // Kích thước file tối đa 20MB
    maxFiles: '14d' // Giữ lại log trong 14 ngày
});

// Tạo logger
const logger = winston.createLogger({
    level: 'info', // Cấp độ log mặc định
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }), // Ghi lại stack trace khi có lỗi
        winston.format.json() // Định dạng log là JSON có cấu trúc
    ),
    transports: [
        // Ghi log ra console (hữu ích cho môi trường dev)
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        }),
        // Ghi log vào file (cho môi trường production)
        fileTransport
    ],
});

export default logger;