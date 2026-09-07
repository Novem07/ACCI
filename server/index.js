const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());


const paymentRoutes = require('./routes/paymentRoutes');
app.use('/api/payments', paymentRoutes);

const authRoutes = require('./routes/auth');
app.use('/api', authRoutes);

const phieuRouter = require('./routes/phieudangky');
app.use('/api/phieudangky', phieuRouter);

const registerRoutes = require('./routes/registerRoutes');
app.use('/api/phieudangky', registerRoutes);

const thisinhRoutes = require('./routes/thisinh');
app.use('/api/thisinh', thisinhRoutes);

const phieuduthiRoutes = require('./routes/phieuduthi');
app.use('/api/phieuduthi', phieuduthiRoutes);

app.use('/api/khachhang', require('./routes/khachhang'));

const chungchiRoutes = require('./routes/chungchi');
app.use('/api/chungchi', chungchiRoutes);

const phieuDangKyGiaHanRoutes = require('./routes/phieudangkygiahan');
app.use('/api/phieudangkygiahan', phieuDangKyGiaHanRoutes);

const lichthiRoutes = require('./routes/lichthi');
app.use('/api/lichthi', lichthiRoutes);

app.listen(5000, () => {
  console.log('Backend chạy tại http://localhost:5000');
});
