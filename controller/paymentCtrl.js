const Razorpay = require("razorpay");

const instance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const checkout = async (req, res) => {
    const { amount } = req.body;
    try{
        const option = {
            amount: amount * 100,
            currency: "INR",
        };
        const order = await instance.orders.create(option);
        res.json({ order, success: true });
    } catch(error){
        throw new Error(error);
    }
}

const paymentVerification = async (req, res) => {
    const { razorpayOrderId, razorpayPaymentId } = req.body;
    try{
        res.json({ razorpayOrderId, razorpayPaymentId });
    } catch(error){
        throw new Error(error);
    }
}

module.exports = {
    checkout,
    paymentVerification,
}