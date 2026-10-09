const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const upload = require('../middleware/upload');
const s = require('../utils/schemas');

const authCtl = require('../controllers/authController');
const tx = require('../controllers/transactionController');
const dash = require('../controllers/dashboardController');
const cal = require('../controllers/calendarController');
const budgets = require('../controllers/budgetController');
const categories = require('../controllers/categoryController');
const people = require('../controllers/personController');
const goals = require('../controllers/goalController');
const recurring = require('../controllers/recurringController');
const reports = require('../controllers/reportController');
const notifications = require('../controllers/notificationController');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please try again in a few minutes.' },
});

// Public
router.post('/auth/register', authLimiter, validate(s.registerSchema), authCtl.register);
router.post('/auth/login', authLimiter, validate(s.loginSchema), authCtl.login);

// Everything below requires a valid JWT
router.use(auth);

router.get('/auth/me', authCtl.me);
router.put('/auth/me', validate(s.profileSchema), authCtl.updateMe);

router.get('/transactions', tx.list);
router.post('/transactions', validate(s.transactionSchema), tx.create);
router.post('/transactions/receipt', upload.single('receipt'), tx.uploadReceipt);
router.route('/transactions/:id').get(tx.get).put(validate(s.transactionSchema), tx.update).delete(tx.remove);

router.get('/dashboard/summary', dash.summary);
router.get('/dashboard/monthly', dash.monthly);
router.get('/dashboard/daily', dash.daily);
router.get('/dashboard/categories', dash.categories);
router.get('/dashboard/payment-methods', dash.paymentMethods);

router.get('/calendar', cal.month);
router.get('/calendar/:date', cal.day);

router.route('/budgets').get(budgets.list).post(validate(s.budgetSchema), budgets.create);
router.route('/budgets/:id').put(validate(s.budgetSchema), budgets.update).delete(budgets.remove);

router.route('/categories').get(categories.list).post(validate(s.categorySchema), categories.create);
router.route('/categories/:id').put(validate(s.categorySchema), categories.update).delete(categories.remove);

router.route('/people').get(people.list).post(validate(s.personSchema), people.create);
router.route('/people/:id').get(people.get).put(validate(s.personSchema), people.update).delete(people.remove);

router.route('/goals').get(goals.list).post(validate(s.goalSchema), goals.create);
router.route('/goals/:id').put(validate(s.goalSchema), goals.update).delete(goals.remove);

router.route('/recurring').get(recurring.list).post(validate(s.recurringSchema), recurring.create);
router.route('/recurring/:id').put(validate(s.recurringSchema), recurring.update).delete(recurring.remove);

router.get('/reports', reports.summary);
router.get('/reports/export', reports.exportReport);

router.get('/notifications', notifications.list);

module.exports = router;
