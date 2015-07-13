'use strict';

var express = require('express');
var controller = require('./messages.controller');

var router = express.Router();

router.get('/', controller.index);
router.get('/:id', controller.show);
router.get('/:schoolid/:userId/:classes', controller.getMessages);
router.get('/:schoolid/:chatname', controller.getConversation);
router.post('/', controller.create);
router.post('/update', controller.update);
router.put('/:id', controller.update);
router.patch('/:id', controller.update);
router.delete('/:id', controller.destroy);

module.exports = router;