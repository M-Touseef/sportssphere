const express = require('express');
const router = express.Router();
const controller = require('./controllers/sparringAvailabilityController');

const mockAuth = (req, res, next) => next();
const protect = mockAuth;
const requireProfessional = mockAuth;
const requireNonProfessional = mockAuth;

const testRoute = (method, path, callback) => {
    console.log(`Checking ${method.toUpperCase()} ${path}...`);
    try {
        if (typeof callback !== 'function' && !Array.isArray(callback)) {
            throw new Error(`Callback for ${path} is ${typeof callback}`);
        }
        router[method](path, callback);
        console.log(`OK: ${path}`);
    } catch (e) {
        console.error(`FAILED: ${path} -> ${e.message}`);
        process.exit(1);
    }
};

testRoute('get', '/professionals', controller.getProfessionalsWithAvailability);
testRoute('get', '/professionals/:id/availability', controller.getProAvailability);
testRoute('get', '/available-pros', controller.getAvailableProsForSlot);
testRoute('post', '/availability/recurring', controller.addRecurringSlot);
testRoute('get', '/availability/recurring/my', controller.getMyRecurringAvailability);
testRoute('delete', '/availability/recurring/:slotId', controller.removeRecurringSlot);
testRoute('post', '/request', controller.sendSparringRequest);
testRoute('post', '/availability', controller.createAvailability);
testRoute('get', '/availability/my', controller.getMyAvailability);
testRoute('put', '/availability/:id', controller.updateAvailability);
testRoute('delete', '/availability/:id', controller.deleteAvailability);
testRoute('patch', '/availability/:id/toggle', controller.toggleAvailability);
testRoute('post', '/request/:slotId', controller.sendSparringRequest);
testRoute('get', '/requests/my', controller.getMySentRequests);
testRoute('get', '/requests/incoming', controller.getIncomingRequests);
testRoute('put', '/requests/:id/accept', controller.acceptRequest);
testRoute('put', '/requests/:id/reject', controller.rejectRequest);

console.log('Final Check: All routes verified.');
