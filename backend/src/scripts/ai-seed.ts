import { Logger } from "@medusajs/medusa";
import { ModuleCreateRelatedProduct, ModuleCreateReview } from "@starter/types";
import {
    ExecArgs,
} from "@medusajs/framework/types";
import {
    ContainerRegistrationKeys,
    ModuleRegistrationName,
} from "@medusajs/framework/utils";
import { createReviewsWorkflow } from "src/workflows/review/workflows";
import { createRelatedProductsWorkflow } from "src/workflows/related-product/workflows";
export default async function seedDemoData({ container }: ExecArgs) {
    const logger: Logger = container.resolve(ContainerRegistrationKeys.LOGGER);
    const productModuleService = container.resolve(ModuleRegistrationName.PRODUCT)
    const customerModuleService = container.resolve(ModuleRegistrationName.CUSTOMER)

    logger.info("Seeding product review data...");
    const [productVariants, productVariantCount] = await productModuleService.listAndCountProductVariants({}, { select: ["sku", "product_id"] });
    const [customers, customerCount] = await customerModuleService.listAndCountCustomers({}, { select: ["first_name", "last_name", "id"] });
    const sampleProductReviewTitles = [
        "Great quality, highly recommend!",
        "Exactly what I was looking for, works perfectly.",
        "Good value for the price.",
        "This product exceeded my expectations!",
        "Very satisfied with this purchase.",
        "Solid performance, no complaints.",
        "Great design and easy to use.",
        "Happy with the quality, would buy again.",
        "Does the job well, no issues so far.",
        "Good value for money, definitely worth it.",
        "Disappointing quality, wouldn't recommend.",
        "Did not meet my expectations at all.",
        "Falls short of what was promised.",
        "Poor build, not worth the money.",
        "Very frustrating to use, would not buy again.",
        "Doesn't work as described, very unreliable.",
        "Arrived damaged, not impressed.",
        "Overhyped and underperforming.",
        "Terrible customer service, not worth it.",
        "Cheap materials, feels flimsy."
    ];
    const sampleProductReviewContents = [
        "The material feels sturdy and durable, making it a solid investment for anyone looking for long-lasting products.",
        "The functionality is spot on, and it has made my daily routine so much easier.",
        "For what you're getting, it's a great deal. It's functional and reliable without breaking the bank.",
        "I wasn't sure if it would deliver, but it does everything it promises and more. Definitely worth every penny.",
        "It arrived quickly, was easy to set up, and works just as described. Couldn't be happier with my decision.",
        "Everything works smoothly, and the product does its job efficiently without any hiccups.",
        "Not only does it look sleek and modern, but it's also intuitive and user-friendly. Definitely a top choice.",
        "The product is high quality, and after using it for a while, it still looks and works like new.",
        "I've been using it for a couple of weeks now, and it's been reliable and exactly what I needed.",
        "It’s a solid, well-built product that provides great features at an affordable price. You get a lot for what you pay.",
        "The quality feels very poor, and it broke within the first week. I wouldn't trust it for long-term use.",
        "I had high hopes for this product, but it failed to deliver. The features are lacking, and it didn't work as expected.",
        "The product's performance doesn't match what was promised in the description. It's slower and less effective than anticipated.",
        "The build quality feels cheap and flimsy, definitely not worth the price. It started showing signs of wear almost immediately.",
        "Very disappointed. It’s difficult to use, and the functionality is poor. I expected much better based on the description.",
        "It malfunctioned after just a few uses. I wouldn't recommend it to anyone who's looking for reliability.",
        "It arrived damaged, and customer service was no help in resolving the issue. Very poor experience all around.",
        "I feel like I was misled by all the positive reviews. The product doesn't live up to the hype and has performance issues.",
        "I reached out to customer support multiple times, but I never got a helpful response. Very frustrating experience.",
        "The materials feel cheap, and the product doesn't hold up well under regular use. Definitely not worth the price."
    ];
    const reviews = productVariants.flatMap(variant => {
        // Create 3000 reviews for each product variant
        return Array(3000).fill(0).map(() => {
            // Select random customer
            const randomCustomer = customers[Math.floor(Math.random() * customerCount)];

            // Generate random rating between 1-5
            const rating = Math.round((Math.random() * 4 + 1) * 10) / 10;

            // Select random title and content
            const randomTitle = rating >= 3 ? sampleProductReviewTitles.slice(0, 10)[Math.floor(Math.random() * 10)] : sampleProductReviewTitles.slice(10)[Math.floor(Math.random() * 10)];
            const randomContent = rating >= 3 ? sampleProductReviewContents.slice(0, 10)[Math.floor(Math.random() * 10)] : sampleProductReviewContents.slice(10)[Math.floor(Math.random() * 10)];



            return {
                variant_sku: variant.sku,
                product_id: variant.product_id,
                customer_name: `${randomCustomer.first_name} ${randomCustomer.last_name}`,
                customer_id: randomCustomer.id,
                title: randomTitle,
                content: randomContent,
                rating: rating
            };
        });
    });

    await createReviewsWorkflow(
        container
    ).run({
        input: reviews as ModuleCreateReview[],
    });
    logger.info("Finished seeding product review data.");

    logger.info("Seeding related product data...");
    const [productIds, _] = await productModuleService.listAndCountProducts({}, { select: ["id"] });
    const copurchaseData = productIds.map(p => p.id).flatMap((queryId, idx, arr) =>
        arr
            .filter(candidateId => candidateId !== queryId)
            .map(candidateId => ({
                query_product_id: queryId,
                candidate_product_id: candidateId,
                copurchase_frequency: Math.floor(Math.random() * 10) + 1, // integer 1-10
            }))
    );

    await createRelatedProductsWorkflow(
        container
    ).run({
        input: copurchaseData as ModuleCreateRelatedProduct[],
    });
    logger.info("Finished seeding related product data.");

}