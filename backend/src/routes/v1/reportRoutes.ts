import { Router } from 'express';
import { generateReport, getReport } from '../../controllers/reportController';
import { validate } from '../../middleware/validate';
import { reportSchema } from '../../utils/validators';

const router = Router();

router.post('/', validate(reportSchema, 'body'), generateReport);
router.get('/:reportId', getReport);

export default router;
