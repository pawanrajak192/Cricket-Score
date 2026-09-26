import { Router } from 'express';
import { listMine, getPublic, create, update, remove } from '../controllers/matches.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Public, read-only — no auth. This is what the frontend's /match/:id
// share-link scorecard page calls.
router.get('/public/:id', getPublic);

router.get('/', requireAuth, listMine);
router.post('/', requireAuth, create);
router.put('/:id', requireAuth, update);
router.delete('/:id', requireAuth, remove);

export default router;
