import {NextFunction, Request, Response} from 'express';
import * as jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'no_secret_key';

// Mở rộng kiểu dữ liệu của Request để thêm thông tin người dùng đã được xác thực
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: number;
                email: string;
                roles: string[];
                permissions: string[];
            };
        }
    }
}

export interface TokenPayload {
    id: number;
    email: string;
    roles: string[];
    permissions: string[];
}

export const checkToken = (token: string) => {
    try {
        jwt.verify(token, JWT_SECRET);
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Middleware xác thực người dùng bằng JWT.
 * Nó kiểm tra token, giải mã và gắn thông tin người dùng vào đối tượng request.
 */
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ message: 'Không có token hoặc token không hợp lệ.' });
        return;
    }

    const token = authHeader.split(' ')[1];

    try {
        req.user = jwt.verify(token, JWT_SECRET) as unknown as TokenPayload;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn.' });
        return;
    }
};

/**
 * Middleware kiểm tra quyền truy cập dựa trên danh sách quyền được yêu cầu.
 * Middleware này phải được đặt SAU authMiddleware trong chuỗi xử lý request.
 * @param requiredPermissions Mảng các quyền cần thiết để truy cập route.
 */
export const checkPermission = (requiredPermissions: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const userPermissions: string[] = req.user?.permissions || [];

        const hasPermission = requiredPermissions.some(permission =>
            userPermissions.includes(permission)
        );

        if (hasPermission) {
            next();
        } else {
            res.status(403).json({ message: 'Không có quyền truy cập tài nguyên này.' });
        }
    };
};

/**
 * Middleware kiểm tra vai trò truy cập dựa trên danh sách vai trò được yêu cầu.
 * Middleware này phải được đặt SAU authMiddleware trong chuỗi xử lý request.
 * @param requiredRoles Mảng các vai trò cần thiết để truy cập route.
 */
export const checkRole = (requiredRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const userRoles: string[] = req.user?.roles || [];

        const hasRole = requiredRoles.some(role =>
            userRoles.includes(role)
        );

        if (hasRole) {
            next();
        } else {
            res.status(403).json({ message: 'Không có vai trò để truy cập tài nguyên này.' });
        }
    };
};