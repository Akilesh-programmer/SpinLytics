const express = require('express');
const router = express.Router();
const controller = require('../controllers/dispatch.controller');
const validate = require('../middleware/validate');
const {
  createDispatchSchema,
  updateDispatchSchema,
  dispatchQuerySchema,
  idParamSchema,
} = require('../validators/dispatch.validator');

router.post('/', validate({ body: createDispatchSchema }), controller.create);
router.get('/', validate({ query: dispatchQuerySchema }), controller.getAll);
router.get('/:id', validate({ params: idParamSchema }), controller.getById);
router.put('/:id', validate({ params: idParamSchema, body: updateDispatchSchema }), controller.update);
router.delete('/:id', validate({ params: idParamSchema }), controller.remove);

module.exports = router;
