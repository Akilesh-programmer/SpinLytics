const express = require('express');
const router = express.Router();
const controller = require('../controllers/packing.controller');
const validate = require('../middleware/validate');
const {
  createPackingSchema,
  updatePackingSchema,
  packingQuerySchema,
  idParamSchema,
} = require('../validators/packing.validator');

router.post('/', validate({ body: createPackingSchema }), controller.create);
router.get('/', validate({ query: packingQuerySchema }), controller.getAll);
router.get('/:id', validate({ params: idParamSchema }), controller.getById);
router.put('/:id', validate({ params: idParamSchema, body: updatePackingSchema }), controller.update);
router.delete('/:id', validate({ params: idParamSchema }), controller.remove);

module.exports = router;
