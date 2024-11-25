app.post("/stripe-checkout", async (req, res) => {
    try {
        // Ensure the request body contains a valid items array
        if (!req.body.items || !Array.isArray(req.body.items)) {
            return res.status(400).send("Invalid items array in the request body.");
        }

        // Map the cart items to Stripe's expected line item format
        const lineItems = req.body.items.map((item) => {
            const unitAmount = Math.round(parseFloat(item.price) * 100);  // Convert price to cents
            if (isNaN(unitAmount)) {
                throw new Error(`Invalid price for item: ${item.title}`);
            }

            return {
                price_data: {
                    currency: "usd",
                    product_data: {
                        name: item.title || "Untitled Product",
                        images: item.image ? [item.image] : [],  // Handle missing images
                    },
                    unit_amount: unitAmount,  // Price in cents
                },
                quantity: item.quantity > 0 ? item.quantity : 1,  // Validate quantity
            };
        });

        // Create Stripe Checkout session
        const session = await stripeGateway.checkout.sessions.create({
            payment_method_types: ["card"],
            mode: "payment",
            success_url: `${process.env.BASE_URL}/success.html`,
            cancel_url: `${process.env.BASE_URL}/cancel.html`,
            billing_address_collection: "required",
            line_items: lineItems,
        });

        // Send the session URL to the client for redirecting to Stripe Checkout
        res.json({ url: session.url });
    } catch (error) {
        console.error("Error creating Stripe checkout session:", error.message);
        res.status(500).send("Internal Server Error");
    }
});
