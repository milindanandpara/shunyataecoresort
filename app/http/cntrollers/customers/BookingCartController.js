const moment = require("moment");

const BookingCartController = () => {
  return {
    addToCart(req, res) {
      try {
        const room = req.body;
        const roomId = room.id || room.roomId;

        if (!roomId) {
          return res.status(400).json({ success: false, message: "Missing room ID" });
        }

        let cart = req.session.cart ? req.session.cart : { items: {}, totalQty: 0, totalPrice: 0 };

        if (!cart.items[roomId]) {
          cart.items[roomId] = { item: room, qty: 1 };
        } else {
          cart.items[roomId].qty += 1;
        }

        // ✔ Days Calculation
        const nights = moment(room.checkout).diff(moment(room.checkin), "days");

        // ✔ Recalculate full totals
        cart.totalQty = Object.values(cart.items).reduce((sum, i) => sum + i.qty, 0);

        cart.totalPrice = Object.values(cart.items).reduce((sum, i) => {
          const days = moment(i.item.checkout).diff(moment(i.item.checkin), "days");
          return sum + (i.item.price * i.qty * days);
        }, 0);

        req.session.cart = cart;

        return res.json({ success: true, totalQty: cart.totalQty });
      } catch (err) {
        console.error("Error in addToCart:", err);
        return res.status(500).json({ success: false, message: "Server error while adding to prebooking" });
      }
    },

    deleteItem(req, res) {
      const { itemId } = req.body;
      let cart = req.session.cart;

      if (cart && cart.items[itemId]) {
        delete cart.items[itemId];

        // Recalculate totals
        cart.totalQty = Object.values(cart.items).reduce((s, i) => s + i.qty, 0);
        cart.totalPrice = Object.values(cart.items).reduce((sum, i) => {
          const days = moment(i.item.checkout).diff(moment(i.item.checkin), "days");
          return sum + (i.item.price * i.qty * days);
        }, 0);

        req.session.cart = cart;
        return res.json({ success: true, totalQty: cart.totalQty });
      }
      return res.json({ success: false, message: 'Item not found' });
    },

    updateItem(req, res) {
      const { itemId, action } = req.body;
      let cart = req.session.cart;

      if (!cart || !cart.items[itemId]) return res.json({ success: false, message: 'Item not found' });

      if (action === 'increase') cart.items[itemId].qty += 1;
      else if (action === 'decrease' && cart.items[itemId].qty > 1) cart.items[itemId].qty -= 1;

      // ✔ Recalculate totals
      cart.totalQty = Object.values(cart.items).reduce((s, i) => s + i.qty, 0);

      cart.totalPrice = Object.values(cart.items).reduce((sum, i) => {
        const days = moment(i.item.checkout).diff(moment(i.item.checkin), "days");
        return sum + (i.item.price * i.qty * days);
      }, 0);

      req.session.cart = cart;

      return res.json({ success: true, totalQty: cart.totalQty });
    },

    viewCart(req, res) {
      return res.render("customer/BookingCart", {
        session: req.session,
        user: req.user,
        messages: req.flash()
      });
    }
  };
};

module.exports = BookingCartController;