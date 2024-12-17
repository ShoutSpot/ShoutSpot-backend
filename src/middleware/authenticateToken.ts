import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { AuthenticatedRequest } from '../modals/modal';

const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader;

  if (!token) {
    res.status(401).json({ message: 'Access token is missing or invalid' });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
    req.email = decoded.email;
    req.id = decoded.id;
    next();
  } catch (err) {
    res.status(403).json({ message: 'Invalid token' });
    return;
  }
};

export default authenticateToken;
