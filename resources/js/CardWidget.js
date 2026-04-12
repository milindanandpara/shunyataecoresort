export class CardWidget {
    stripe = null;
    card = null;

    style = {
        base: {
            color: "#32325d",
            fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
            fontSmoothing: "antialiased",
            fontSize: "16px",
            "::placeholder": {
                color: "#aab7c4",
            },
        },
        invalid: {
            color: "#fa755a",
            iconColor: "#fa755a",
        },
    };

    constructor(stripe) {
        this.stripe = stripe;
    }

    mount() {
        const elements = this.stripe.elements();
        this.card = elements.create("card", { style: this.style, hidePostalCode: true });
        this.card.mount("#card-element");
    }

    destroy() {
        if (this.card) {
            this.card.destroy();
        }
    }

    async createPaymentMethod() {
        try {
            const result = await this.stripe.createPaymentMethod({
                type: "card",
                card: this.card,
            });

            if (result.error) {
                console.error("Payment Method Error:", result.error.message);
                return null;
            }
            return result.paymentMethod;
        } catch (error) {
            console.error("Stripe Error:", error);
            return null;
        }
    }
}