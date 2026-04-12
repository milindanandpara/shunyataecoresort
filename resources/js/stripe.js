import { loadStripe } from "@stripe/stripe-js";
import { placeOrder } from "./apiService";
import { CardWidget } from "./CardWidget";

export async function initStripe() {
    const stripe = await loadStripe("pk_live_51QdVrVGS3gTGzcVrjp9DTfxJwBqqw77PoSIuIY5HroTZ5lKvDUOaLpb9q8kD4HAQvrwyrpbv3TQpUENDkuANCoeI00pNJ0n08V");
    let card = null;

    const paymentType = document.querySelector("#paymentType");
    if (!paymentType) {
        return;
    }

    paymentType.addEventListener("change", (e) => {
        if (e.target.value === "card") {
            card = new CardWidget(stripe);
            card.mount();
        } else {
            if (card) {
                card.destroy();
            }
        }
    });

    // Handle form submission
    const paymentForm = document.querySelector("#payment-form");
    if (paymentForm) {
        paymentForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            let formData = new FormData(paymentForm);
            let formObject = {};
            for (let [key, value] of formData.entries()) {
                formObject[key] = value;
            }

            if (!card) {
                // Handle non-card payments
                placeOrder(formObject);
                return;
            }

            // Create PaymentMethod
            const paymentMethod = await card.createPaymentMethod();
            if (!paymentMethod) {
                return; // Handle errors shown in createPaymentMethod
            }

            formObject.paymentType = "card";
            formObject.paymentMethodId = paymentMethod.id; // Attach PaymentMethod ID
            placeOrder(formObject);
        });
    }
}