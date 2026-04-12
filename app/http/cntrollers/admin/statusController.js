const  Order  = require('../../../models/Booking'); // Assuming you have defined the Order model in Sequelize

function statusController() {
    return {
        async update(req, res) {
            try {
                const { orderId, status } = req.body;
                console.log('Updating Order:', orderId, 'New Status:', status); // Debug log
        
                const [updatedRows] = await Order.update(
                    { status: status },
                    { where: { id: orderId } }
                );
        
                console.log('Rows Updated:', updatedRows); // Check how many rows were updated
        
                if (updatedRows === 0) {
                    console.log('Order not found or status unchanged.');
                    return res.redirect('/admin/orders');
                }
        
                // Emit event for real-time update
                const eventEmitter = req.app.get('eventEmitter');
                eventEmitter.emit('orderUpdated', { id: orderId, status: status });
        
                return res.redirect('/admin/orders');
            } catch (error) {
                console.error('Error updating order status:', error);
                return res.redirect('/admin/orders');
            }
        }
    };
}

module.exports = statusController;