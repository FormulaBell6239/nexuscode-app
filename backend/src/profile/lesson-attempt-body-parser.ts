import { NextFunction, Request, Response, json } from 'express';

export function requireLessonAttemptJson(req: Request, res: Response, next: NextFunction): void {
  if (!req.is('application/json')) {
    res.status(415).json({
      statusCode: 415,
      code: 'UNSUPPORTED_LESSON_ATTEMPT_CONTENT_TYPE',
      message: 'Lesson attempts require application/json.',
    });
    return;
  }
  next();
}

export function lessonAttemptJsonParser() {
  return json({ limit: '80kb' });
}
