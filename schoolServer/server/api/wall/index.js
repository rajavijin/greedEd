'use strict';

var express = require('express');
var controller = require('./wall.controller');
var fs = require('fs');
var busboy = require('connect-busboy'); //middleware for form/file upload

var router = express.Router();

router.get('/', controller.index);
router.get('/:id', controller.show);
router.get('/:schoolid/:to', controller.wall);
router.post('/', controller.create);
router.post('/upload', controller.upload);
router.post('/:id', controller.update);
router.put('/:id', controller.update);
router.patch('/:id', controller.update);
router.delete('/:id', controller.destroy);

module.exports = router;