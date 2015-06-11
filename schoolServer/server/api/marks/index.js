'use strict';

var express = require('express');
var controller = require('./marks.controller');

var router = express.Router();

router.get('/', controller.index);
router.get('/:id', controller.show);
router.get('/:schoolid/:educationyear/:typeofexam/:studentid/:standard/:division', controller.getMark);
router.get('/:schoolid/:educationyear/:typeofexam/:standard/:division/:status/:subject/:mark/:grade', controller.listUsers);
router.get('/:typeofexam', controller.getAllMarks);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.post('/:id', controller.update);
router.patch('/:id', controller.update);
router.delete('/:id', controller.destroy);

module.exports = router;