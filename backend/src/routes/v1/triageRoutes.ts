import { Router } from 'express';
import { analyzeTriage, getSession, getQuestions } from '../../controllers/triageController';
import { validate } from '../../middleware/validate';
import { triageSchema, questionsSchema } from '../../utils/validators';

const router = Router();

router.post('/questions', validate(questionsSchema, 'body'), getQuestions);
router.post('/analyze', validate(triageSchema, 'body'), analyzeTriage);
router.get('/:sessionId', getSession);

export default router;
