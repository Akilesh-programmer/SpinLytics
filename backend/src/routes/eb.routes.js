const express = require('express');
const router = express.Router();
const controller = require('../controllers/eb.controller');
const validate = require('../middleware/validate');
const {
  createEBSchema,
  updateEBSchema,
  ebQuerySchema,
  idParamSchema,
  monthYearParamSchema,
} = require('../validators/eb.validator');

router.post('/', validate({ body: createEBSchema }), controller.create);
router.get('/', validate({ query: ebQuerySchema }), controller.getAll);
router.get('/month/:year/:month', validate({ params: monthYearParamSchema }), controller.getByMonthYear);
router.get('/:id', validate({ params: idParamSchema }), controller.getById);
router.put('/:id', validate({ params: idParamSchema, body: updateEBSchema }), controller.update);
router.delete('/:id', validate({ params: idParamSchema }), controller.remove);

module.exports = router;
