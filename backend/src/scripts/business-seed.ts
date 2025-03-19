import {
    batchInventoryItemLevelsWorkflow,
    createApiKeysWorkflow,
    createCollectionsWorkflow,
    createCustomerAccountWorkflow,
    createProductCategoriesWorkflow,
    createProductsWorkflow,
    createRegionsWorkflow,
    createSalesChannelsWorkflow,
    createShippingOptionsWorkflow,
    createShippingProfilesWorkflow,
    createStockLocationsWorkflow,
    createTaxRegionsWorkflow,
    createUserAccountWorkflow,
    linkSalesChannelsToApiKeyWorkflow,
    linkSalesChannelsToStockLocationWorkflow,
    updateStoresWorkflow,
} from "@medusajs/core-flows";
import {
    ExecArgs,
    IFulfillmentModuleService,
    ISalesChannelModuleService,
    IStoreModuleService,
} from "@medusajs/framework/types";
import {
    ContainerRegistrationKeys,
    ModuleRegistrationName,
    Modules,
    ProductStatus,
} from "@medusajs/framework/utils";
import { Logger } from "@medusajs/medusa";
import { RemoteLink } from "@medusajs/modules-sdk";
import { jwtDecode } from "jwt-decode";

export default async function seedDemoData({ container }: ExecArgs) {
    const logger: Logger = container.resolve(ContainerRegistrationKeys.LOGGER);
    const remoteLink: RemoteLink = container.resolve(
        ContainerRegistrationKeys.REMOTE_LINK
    );
    const fulfillmentModuleService: IFulfillmentModuleService = container.resolve(
        ModuleRegistrationName.FULFILLMENT
    );
    const salesChannelModuleService: ISalesChannelModuleService =
        container.resolve(ModuleRegistrationName.SALES_CHANNEL);
    const storeModuleService: IStoreModuleService = container.resolve(
        ModuleRegistrationName.STORE
    );
    const inventoryModuleService = container.resolve(ModuleRegistrationName.INVENTORY)

    const countries = ["gb", "de", "dk", "se", "fr", "es", "it", "vn", "la", "kh"];
    const asia_contries = countries.slice(-3);
    const europe_countries = countries.slice(0, 7);


    logger.info("Seeding store data...");
    const [store] = await storeModuleService.listStores();
    let defaultSalesChannel = await salesChannelModuleService.listSalesChannels({
        name: "Default Sales Channel",
    });

    if (!defaultSalesChannel.length) {
        // create the default sales channel
        const { result: salesChannelResult } = await createSalesChannelsWorkflow(
            container
        ).run({
            input: {
                salesChannelsData: [
                    {
                        name: "Default Sales Channel",
                    },
                ],
            },
        });
        defaultSalesChannel = salesChannelResult;
    }

    await updateStoresWorkflow(container).run({
        input: {
            selector: { id: store.id },
            update: {
                name: "C.V.O.S",
                supported_currencies: [
                    {
                        currency_code: "usd",
                        is_default: true,
                    },
                    {
                        currency_code: "eur",
                    },
                    {
                        currency_code: "vnd",
                    },
                    {
                        currency_code: "khr",
                    },
                    {
                        currency_code: "lak",
                    },
                ],
                default_sales_channel_id: defaultSalesChannel[0].id,
            },
        },
    });
    logger.info("Seeding region data...");
    const { result: regionResult } = await createRegionsWorkflow(container).run({
        input: {
            regions: [
                {
                    name: "Europe",
                    currency_code: "eur",
                    countries: europe_countries,
                    payment_providers: ["pp_system_default"],
                },
                {
                    name: "Viet Nam",
                    currency_code: "vnd",
                    countries: ["vn"],
                    payment_providers: ["pp_system_default"],
                },
                {
                    name: "Laos",
                    currency_code: "lak",
                    countries: ["la"],
                    payment_providers: ["pp_system_default"],
                },
                {
                    name: "Cambodia",
                    currency_code: "khr",
                    countries: ["kh"],
                    payment_providers: ["pp_system_default"],
                },
            ],
        },
    });
    const region = regionResult[0];
    logger.info("Finished seeding regions.");

    logger.info("Seeding tax regions...");
    await createTaxRegionsWorkflow(container).run({
        input: countries.map((country_code) => ({
            country_code,
        })),
    });
    logger.info("Finished seeding tax regions.");

    logger.info("Seeding stock location data...");
    const { result: stockLocationResult } = await createStockLocationsWorkflow(
        container
    ).run({
        input: {
            locations: [
                {
                    name: "European Warehouse",
                    address: {
                        city: "Copenhagen",
                        country_code: "DK",
                        address_1: "",
                    },
                },
                {
                    name: "Indochine Warehouse",
                    address: {
                        city: "Ho Chi Minh",
                        country_code: "VN",
                        address_1: "",
                    },
                },
            ],
        },
    });
    const stockLocation = stockLocationResult[0];

    await remoteLink.create({
        [Modules.STOCK_LOCATION]: {
            stock_location_id: stockLocation.id,
        },
        [Modules.FULFILLMENT]: {
            fulfillment_provider_id: "manual_manual",
        },
    });

    logger.info("Seeding fulfillment data...");
    const { result: shippingProfileResult } =
        await createShippingProfilesWorkflow(container).run({
            input: {
                data: [
                    {
                        name: "Default",
                        type: "default",
                    },
                ],
            },
        });
    const shippingProfile = shippingProfileResult[0];

    const fulfillmentSet = await fulfillmentModuleService.createFulfillmentSets({
        name: "Global Warehouse delivery",
        type: "shipping",
        service_zones: [
            {
                name: "Europe",
                geo_zones: [
                    {
                        country_code: "gb",
                        type: "country",
                    },
                    {
                        country_code: "de",
                        type: "country",
                    },
                    {
                        country_code: "dk",
                        type: "country",
                    },
                    {
                        country_code: "se",
                        type: "country",
                    },
                    {
                        country_code: "fr",
                        type: "country",
                    },
                    {
                        country_code: "es",
                        type: "country",
                    },
                    {
                        country_code: "it",
                        type: "country",
                    },
                ],
            },
            {
                name: "Asia",
                geo_zones: [
                    {
                        country_code: "vn",
                        type: "country",
                    },
                    {
                        country_code: "kh",
                        type: "country",
                    },
                    {
                        country_code: "la",
                        type: "country",
                    },
                ],
            },
        ],
    });

    await remoteLink.create({
        [Modules.STOCK_LOCATION]: {
            stock_location_id: stockLocation.id,
        },
        [Modules.FULFILLMENT]: {
            fulfillment_set_id: fulfillmentSet.id,
        },
    });

    await createShippingOptionsWorkflow(container).run({
        input: [
            {
                name: "Standard Shipping",
                price_type: "flat",
                provider_id: "manual_manual",
                service_zone_id: fulfillmentSet.service_zones[0].id,
                shipping_profile_id: shippingProfile.id,
                type: {
                    label: "Standard",
                    description: "Ship in 2-3 days.",
                    code: "standard",
                },
                prices: [
                    {
                        currency_code: "usd",
                        amount: 10,
                    },
                    {
                        currency_code: "eur",
                        amount: 10,
                    },
                    {
                        region_id: region.id,
                        amount: 10,
                    },
                ],
                rules: [
                    {
                        attribute: "enabled_in_store",
                        value: "true",
                        operator: "eq",
                    },
                    {
                        attribute: "is_return",
                        value: "false",
                        operator: "eq",
                    },
                ],
            },
            {
                name: "Express Shipping",
                price_type: "flat",
                provider_id: "manual_manual",
                service_zone_id: fulfillmentSet.service_zones[0].id,
                shipping_profile_id: shippingProfile.id,
                type: {
                    label: "Express",
                    description: "Ship in 24 hours.",
                    code: "express",
                },
                prices: [
                    {
                        currency_code: "usd",
                        amount: 15,
                    },
                    {
                        currency_code: "eur",
                        amount: 15,
                    },
                    {
                        region_id: region.id,
                        amount: 15,
                    },
                ],
                rules: [
                    {
                        attribute: "enabled_in_store",
                        value: "true",
                        operator: "eq",
                    },
                    {
                        attribute: "is_return",
                        value: "false",
                        operator: "eq",
                    },
                ],
            },
            {
                name: "Standard Shipping",
                price_type: "flat",
                provider_id: "manual_manual",
                service_zone_id: fulfillmentSet.service_zones[1].id,
                shipping_profile_id: shippingProfile.id,
                type: {
                    label: "Standard",
                    description: "Ship in 2-3 days.",
                    code: "standard",
                },
                prices: [
                    {
                        currency_code: "usd",
                        amount: 10,
                    },
                    {
                        currency_code: "eur",
                        amount: 10,
                    },
                    {
                        region_id: region.id,
                        amount: 10,
                    },
                    {
                        currency_code: "lak",
                        amount: 42000,
                    },
                    {
                        currency_code: "khr",
                        amount: 6000,
                    },
                    {
                        currency_code: "vnd",
                        amount: 30000,
                    },
                ],
                rules: [
                    {
                        attribute: "enabled_in_store",
                        value: "true",
                        operator: "eq",
                    },
                    {
                        attribute: "is_return",
                        value: "false",
                        operator: "eq",
                    },
                ],
            },
            {
                name: "Express Shipping",
                price_type: "flat",
                provider_id: "manual_manual",
                service_zone_id: fulfillmentSet.service_zones[1].id,
                shipping_profile_id: shippingProfile.id,
                type: {
                    label: "Express",
                    description: "Ship in 24 hours.",
                    code: "express",
                },
                prices: [
                    {
                        currency_code: "usd",
                        amount: 15,
                    },
                    {
                        currency_code: "eur",
                        amount: 15,
                    },
                    {
                        region_id: region.id,
                        amount: 15,
                    },
                    {
                        currency_code: "lak",
                        amount: 55000,
                    },
                    {
                        currency_code: "khr",
                        amount: 8000,
                    },
                    {
                        currency_code: "vnd",
                        amount: 45000,
                    },
                ],
                rules: [
                    {
                        attribute: "enabled_in_store",
                        value: "true",
                        operator: "eq",
                    },
                    {
                        attribute: "is_return",
                        value: "false",
                        operator: "eq",
                    },
                ],
            },
        ],
    });
    logger.info("Finished seeding fulfillment data.");

    await linkSalesChannelsToStockLocationWorkflow(container).run({
        input: {
            id: stockLocation.id,
            add: [defaultSalesChannel[0].id],
        },
    });
    logger.info("Finished seeding stock location data.");

    logger.info("Seeding publishable API key data...");
    const { result: publishableApiKeyResult } = await createApiKeysWorkflow(
        container
    ).run({
        input: {
            api_keys: [
                {
                    title: "Webshop",
                    type: "publishable",
                    created_by: "",
                },
            ],
        },
    });
    const publishableApiKey = publishableApiKeyResult[0];

    await linkSalesChannelsToApiKeyWorkflow(container).run({
        input: {
            id: publishableApiKey.id,
            add: [defaultSalesChannel[0].id],
        },
    });
    logger.info("Finished seeding publishable API key data.");

    logger.info("Seeding customer and admin data...");
    try {
        const { token: token_admin_1 } = await fetch(
            `${process.env.PUBLIC_MEDUSA_BACKEND_URL}/auth/user/emailpass/register`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: "21110785@student.hcmute.edu.vn",
                    password: "supersecret",
                })
            }
        ).then((res) => res.json());
        if (token_admin_1) {
            await createUserAccountWorkflow(container).run({
                input: {
                    authIdentityId: `${jwtDecode(token_admin_1).auth_identity_id}`,
                    userData: {
                        email: "21110785@student.hcmute.edu.vn",
                        first_name: "Mai Nguyen",
                        last_name: "Nhat Nam",
                    }
                }
            });
        }
        const { token: token_admin_2 } = await fetch(
            `${process.env.PUBLIC_MEDUSA_BACKEND_URL}/auth/user/emailpass/register`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: "21110762@student.hcmute.edu.vn",
                    password: "supersecret",
                })
            }
        ).then((res) => res.json());
        if (token_admin_2) {
            await createUserAccountWorkflow(container).run({
                input: {
                    authIdentityId: `${jwtDecode(token_admin_2).auth_identity_id}`,
                    userData: {
                        email: "21110762@student.hcmute.edu.vn",
                        first_name: "Cao",
                        last_name: "Thai Dat",
                    }
                }
            });
        }
        const { token: token_customer_1 } = await fetch(
            `${process.env.PUBLIC_MEDUSA_BACKEND_URL}/auth/customer/emailpass/register`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: "nhatnam0192123@gmail.com",
                    password: "supersecret",
                })
            }
        ).then((res) => res.json());
        if (token_customer_1) {
            await createCustomerAccountWorkflow(container).run({
                input: {
                    authIdentityId: `${jwtDecode(token_customer_1).auth_identity_id}`,
                    customerData: {
                        email: "nhatnam0192123@gmail.com",
                        first_name: "Hashkell",
                        last_name: "Hanksenberg",
                    }
                }
            });
        }
        const { token: token_customer_2 } = await fetch(
            `${process.env.PUBLIC_MEDUSA_BACKEND_URL}/auth/customer/emailpass/register`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: "mnvn1ngan@gmail.com",
                    password: "supersecret",
                })
            }
        ).then((res) => res.json());
        if (token_customer_2) {
            await createCustomerAccountWorkflow(container).run({
                input: {
                    authIdentityId: `${jwtDecode(token_customer_2).auth_identity_id}`,
                    customerData: {
                        email: "mnvn1ngan@gmail.com",
                        first_name: "Iroha",
                        last_name: "Jules",
                    }
                }
            });
        }
    } catch (error: any) {
        logger.error(error.toString())
    }

    logger.info("Finished seeding customer and admin data.");

    logger.info("Seeding product data...");

    const {
        result: [collection],
    } = await createCollectionsWorkflow(container).run({
        input: {
            collections: [
                {
                    title: "Featured",
                    handle: "featured",
                },
                {
                    title: "Recently added",
                    handle: "recently-added",
                },
            ],
        },
    });

    const { result: categoryResult } = await createProductCategoriesWorkflow(
        container
    ).run({
        input: {
            product_categories: [
                {
                    name: "Laptops",
                    is_active: false,
                },
                {
                    name: "Accessories",
                    is_active: true,
                },
                {
                    name: "Phones",
                    is_active: false,
                },
                {
                    name: "Monitors",
                    is_active: false,
                },
                {
                    name: "Consoles",
                    is_active: true,
                },
                {
                    name: "Action & Adventure",
                    handle: "action-adventure",
                    is_active: true,
                },
            ],
        },
    });

    await createProductsWorkflow(container).run({
        input: {
            products: [
                {
                    title:
                        '16" Ultra-Slim AI Laptop | 3K OLED | 1.1cm Thin | 6-Speaker Audio',
                    collection_id: collection.id,
                    category_ids: [
                        categoryResult.find((cat) => cat.name === "Laptops")?.id!,
                    ],
                    description:
                        "This ultra-thin 16-inch laptop is a sophisticated, high-performance machine for the new era of artificial intelligence. It has been completely redesigned from the inside out. The cabinet features an exquisite new ceramic-aluminum composite material in a range of nature-inspired colors. This material provides durability while completing the ultra-slim design and resisting the test of time. This innovative computer utilizes the latest AI-enhanced processor with quiet ambient cooling. It's designed to enrich your lifestyle on the go with an astonishingly thin 1.1cm chassis that houses an advanced 16-inch 3K OLED display and immersive six-speaker audio.",
                    weight: 400,
                    status: ProductStatus.DRAFT,
                    images: [
                        {
                            url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/laptop-front.png",
                        },
                        {
                            url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/laptop-side.png",
                        },
                        {
                            url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/laptop-top.png",
                        },
                    ],
                    options: [
                        {
                            title: "Storage",
                            values: ["256 GB", "512 GB"],
                        },
                        {
                            title: "Color",
                            values: ["Blue", "Red"],
                        },
                    ],
                    variants: [
                        {
                            title: "256 GB / Blue",
                            sku: "256-BLUE",
                            options: {
                                Storage: "256 GB",
                                Color: "Blue",
                            },
                            manage_inventory: true,
                            prices: [
                                {
                                    amount: 1299,
                                    currency_code: "usd",
                                },
                                {
                                    amount: 1197,
                                    currency_code: "eur",
                                },
                                {
                                    amount: 33214000,
                                    currency_code: "vnd",
                                },
                                {
                                    amount: 5206000,
                                    currency_code: "khr",
                                },
                                {
                                    amount: 28119000,
                                    currency_code: "lak",
                                },
                            ],
                        },
                        {
                            title: "512 GB / Red",
                            sku: "512-RED",
                            options: {
                                Storage: "512 GB",
                                Color: "Red",
                            },
                            manage_inventory: true,
                            prices: [
                                {
                                    amount: 1259,
                                    currency_code: "usd",
                                },
                                {
                                    amount: 1160,
                                    currency_code: "eur",
                                },
                                {
                                    amount: 32083000,
                                    currency_code: "vnd",
                                },
                                {
                                    amount: 5046217,
                                    currency_code: "khr",
                                },
                                {
                                    amount: 27279000,
                                    currency_code: "lak",
                                },
                            ],
                        },
                    ],
                    sales_channels: [
                        {
                            id: defaultSalesChannel[0].id,
                        },
                    ],
                },
            ],
        },
    });

    await createProductsWorkflow(container).run({
        input: {
            products: [
                {
                    title: "1080p HD Pro Webcam | Superior Video | Privacy enabled",
                    category_ids: [
                        categoryResult.find((cat) => cat.name === "Accessories")?.id!,
                    ],
                    description:
                        "High-quality 1080p HD webcam that elevates your work environment with superior video and audio that outperforms standard laptop cameras. Achieve top-tier video collaboration at a cost-effective price point, ideal for widespread deployment across your organization.",
                    weight: 400,
                    status: ProductStatus.DRAFT,
                    images: [
                        {
                            url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/camera-front.png",
                        },
                        {
                            url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/camera-side.png",
                        },
                    ],
                    options: [
                        {
                            title: "Color",
                            values: ["Black", "White"],
                        },
                    ],
                    variants: [
                        {
                            title: "Webcam Black",
                            sku: "WEBCAM-BLACK",
                            options: {
                                Color: "Black",
                            },
                            manage_inventory: true,
                            prices: [
                                {
                                    amount: 59,
                                    currency_code: "usd",
                                },
                                {
                                    amount: 55,
                                    currency_code: "eur",
                                },
                                {
                                    amount: 1508000,
                                    currency_code: "vnd",
                                },
                                {
                                    amount: 237000,
                                    currency_code: "khr",
                                },
                                {
                                    amount: 1279000,
                                    currency_code: "lak",
                                },
                            ],
                        },
                        {
                            title: "Webcam White",
                            sku: "WEBCAM-WHITE",
                            options: {
                                Color: "White",
                            },
                            manage_inventory: true,
                            prices: [
                                {
                                    amount: 60,
                                    currency_code: "eur",
                                },
                                {
                                    amount: 1661000,
                                    currency_code: "vnd",
                                },
                                {
                                    amount: 261000,
                                    currency_code: "khr",
                                },
                                {
                                    amount: 1408000,
                                    currency_code: "lak",
                                },
                                {
                                    amount: 65,
                                    currency_code: "usd",
                                },
                            ],
                        },
                    ],
                    sales_channels: [
                        {
                            id: defaultSalesChannel[0].id,
                        },
                    ],
                },
            ],
        },
    });

    await createProductsWorkflow(container).run({
        input: {
            products: [
                {
                    title: `6.5" Ultra HD Smartphone | 3x Impact-Resistant Screen`,
                    collection_id: collection.id,
                    category_ids: [
                        categoryResult.find((cat) => cat.name === "Phones")?.id!,
                    ],
                    description:
                        'This premium smartphone is crafted from durable and lightweight aerospace-grade aluminum, featuring an expansive 6.5" Ultra-High Definition AMOLED display. It boasts exceptional durability with a cutting-edge nanocrystal glass front, offering three times the impact resistance of standard smartphone screens. The device combines sleek design with robust protection, setting a new standard for smartphone resilience and visual excellence. Copy',
                    weight: 400,
                    status: ProductStatus.DRAFT,
                    images: [
                        {
                            url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/phone-front.png",
                        },
                        {
                            url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/phone-side.png",
                        },
                        {
                            url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/phone-bottom.png",
                        },
                    ],
                    options: [
                        {
                            title: "Memory",
                            values: ["256 GB", "512 GB"],
                        },
                        {
                            title: "Color",
                            values: ["Purple", "Red"],
                        },
                    ],
                    variants: [
                        {
                            title: "256 GB Purple",
                            sku: "PHONE-256-PURPLE",
                            options: {
                                Memory: "256 GB",
                                Color: "Purple",
                            },
                            manage_inventory: true,
                            prices: [
                                {
                                    amount: 919,
                                    currency_code: "eur",
                                },
                                {
                                    amount: 25474500,
                                    currency_code: "vnd",
                                },
                                {
                                    amount: 4095900,
                                    currency_code: "khr",
                                },
                                {
                                    amount: 21578400,
                                    currency_code: "lak",
                                },
                                {
                                    amount: 999,
                                    currency_code: "usd",
                                }
                            ],
                        },
                        {
                            title: "256 GB Red",
                            sku: "PHONE-256-RED",
                            options: {
                                Memory: "256 GB",
                                Color: "Red",
                            },
                            manage_inventory: true,
                            prices: [
                                {
                                    amount: 882,
                                    currency_code: "eur",
                                },
                                {
                                    amount: 24454500,
                                    currency_code: "vnd",
                                },
                                {
                                    amount: 3931900,
                                    currency_code: "khr",
                                },
                                {
                                    amount: 20714400,
                                    currency_code: "lak",
                                },
                                {
                                    amount: 959,
                                    currency_code: "usd",
                                }
                            ],
                        },
                    ],
                    sales_channels: [
                        {
                            id: defaultSalesChannel[0].id,
                        },
                    ],
                },
            ],
        },
    });

    await createProductsWorkflow(container).run({
        input: {
            products: [
                {
                    title: `34" QD-OLED Curved Gaming Monitor | Ultra-Wide | Infinite Contrast | 175Hz`,
                    collection_id: collection.id,
                    category_ids: [
                        categoryResult.find((cat) => cat.name === "Monitors")?.id!,
                    ],
                    description:
                        "Experience the pinnacle of display technology with this 34-inch curved monitor. By merging OLED panels and Quantum Dot technology, this QD-OLED screen delivers exceptional contrast, deep blacks, unlimited viewing angles, and vivid colors. The curved design provides an immersive experience, allowing you to enjoy the best of both worlds in one cutting-edge display. This innovative monitor represents the ultimate fusion of visual performance and immersive design.",
                    weight: 400,
                    status: ProductStatus.DRAFT,
                    images: [
                        {
                            url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/screen-front.png",
                        },
                        {
                            url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/screen-side.png",
                        },
                        {
                            url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/screen-top.png",
                        },
                        {
                            url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/screen-back.png",
                        },
                    ],
                    options: [
                        {
                            title: "Color",
                            values: ["White", "Black"],
                        },
                    ],
                    variants: [
                        {
                            title: "ACME Monitor 4k White",
                            sku: "ACME-MONITOR-WHITE",
                            options: {
                                Color: "White",
                            },
                            manage_inventory: true,
                            prices: [
                                {
                                    amount: 551,
                                    currency_code: "eur",
                                },
                                {
                                    amount: 15274500,
                                    currency_code: "vnd",
                                },
                                {
                                    amount: 2455900,
                                    currency_code: "khr",
                                },
                                {
                                    amount: 12938400,
                                    currency_code: "lak",
                                },
                                {
                                    amount: 599,
                                    currency_code: "usd",
                                }
                            ],
                        },
                        {
                            title: "ACME Monitor 4k White",
                            sku: "ACME-MONITOR-BLACK",
                            options: {
                                Color: "Black",
                            },
                            manage_inventory: true,
                            prices: [
                                {
                                    amount: 551,
                                    currency_code: "eur",
                                },
                                {
                                    amount: 15274500,
                                    currency_code: "vnd",
                                },
                                {
                                    amount: 2455900,
                                    currency_code: "khr",
                                },
                                {
                                    amount: 12938400,
                                    currency_code: "lak",
                                },
                                {
                                    amount: 599,
                                    currency_code: "usd",
                                }
                            ],
                        },
                    ],
                    sales_channels: [
                        {
                            id: defaultSalesChannel[0].id,
                        },
                    ],
                },
            ],
        },
    });

    await createProductsWorkflow(container).run({
        input: {
            products: [
                {
                    title: "Hi-Fi Gaming Headset | Pro-Grade DAC | Hi-Res Certified",
                    collection_id: collection.id,
                    category_ids: [
                        categoryResult.find((cat) => cat.name === "Accessories")?.id!,
                    ],
                    description: `Experience studio-quality audio with this advanced acoustic system, which pairs premium hardware with high-fidelity sound and innovative audio software for an immersive listening experience. The integrated digital-to-analog converter (DAC) enhances the audio setup with high-resolution certification and a built-in amplifier, delivering exceptional sound clarity and depth. This comprehensive audio solution brings professional-grade sound to your personal environment, whether for gaming, music production, or general entertainment.`,
                    weight: 400,
                    status: ProductStatus.PUBLISHED,
                    images: [
                        {
                            url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/headphone-front.png",
                        },
                        {
                            url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/headphone-side.png",
                        },
                        {
                            url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/headphone-top.png",
                        },
                    ],
                    options: [
                        {
                            title: "Color",
                            values: ["Black", "White"],
                        },
                    ],
                    variants: [
                        {
                            title: "Headphone Black",
                            sku: "HEADPHONE-BLACK",
                            options: {
                                Color: "Black",
                            },
                            manage_inventory: true,
                            prices: [
                                {
                                    amount: 137,
                                    currency_code: "eur",
                                },
                                {
                                    amount: 3799500,
                                    currency_code: "vnd",
                                },
                                {
                                    amount: 610900,
                                    currency_code: "khr",
                                },
                                {
                                    amount: 3218400,
                                    currency_code: "lak",
                                },
                                {
                                    amount: 149,
                                    currency_code: "usd",
                                }
                            ],
                        },
                        {
                            title: "Headphone White",
                            sku: "HEADPHONE-WHITE",
                            options: {
                                Color: "White",
                            },
                            manage_inventory: true,
                            prices: [
                                {
                                    amount: 137,
                                    currency_code: "eur",
                                },
                                {
                                    amount: 3799500,
                                    currency_code: "vnd",
                                },
                                {
                                    amount: 610900,
                                    currency_code: "khr",
                                },
                                {
                                    amount: 3218400,
                                    currency_code: "lak",
                                },
                                {
                                    amount: 149,
                                    currency_code: "usd",
                                }
                            ],
                        },
                    ],
                    sales_channels: [
                        {
                            id: defaultSalesChannel[0].id,
                        },
                    ],
                },
            ],
        },
    });

    await createProductsWorkflow(container).run({
        input: {
            products: [
                {
                    title: "Wireless Keyboard | Touch ID | Numeric Keypad",
                    category_ids: [
                        categoryResult.find((cat) => cat.name === "Accessories")?.id!,
                    ],
                    description: `This wireless keyboard offers a comfortable typing experience with a numeric keypad and Touch ID. It features navigation buttons, full-sized arrow keys, and is ideal for spreadsheets and gaming. The rechargeable battery lasts about a month. It pairs automatically with compatible computers and includes a USB-C to Lightning cable for charging and pairing.`,
                    weight: 400,
                    status: ProductStatus.PUBLISHED,
                    images: [
                        {
                            url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/keyboard-front.png",
                        },
                        {
                            url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/keyboard-side.png",
                        },
                    ],
                    options: [
                        {
                            title: "Color",
                            values: ["Black", "White"],
                        },
                    ],
                    variants: [
                        {
                            title: "Keyboard Black",
                            sku: "KEYBOARD-BLACK",
                            options: {
                                Color: "Black",
                            },
                            manage_inventory: true,
                            prices: [
                                {
                                    amount: 91,
                                    currency_code: "eur",
                                },
                                {
                                    amount: 2524500,
                                    currency_code: "vnd",
                                },
                                {
                                    amount: 405900,
                                    currency_code: "khr",
                                },
                                {
                                    amount: 2138400,
                                    currency_code: "lak",
                                },
                                {
                                    amount: 99,
                                    currency_code: "usd",
                                }
                            ],
                        },
                        {
                            title: "Keyboard White",
                            sku: "KEYBOARD-WHITE",
                            options: {
                                Color: "White",
                            },
                            manage_inventory: true,
                            prices: [
                                {
                                    amount: 91,
                                    currency_code: "eur",
                                },
                                {
                                    amount: 2524500,
                                    currency_code: "vnd",
                                },
                                {
                                    amount: 405900,
                                    currency_code: "khr",
                                },
                                {
                                    amount: 2138400,
                                    currency_code: "lak",
                                },
                                {
                                    amount: 99,
                                    currency_code: "usd",
                                }
                            ],
                        },
                    ],
                    sales_channels: [
                        {
                            id: defaultSalesChannel[0].id,
                        },
                    ],
                },
            ],
        },
    });

    await createProductsWorkflow(container).run({
        input: {
            products: [
                {
                    title: "Wireless Rechargeable Mouse | Multi-Touch Surface",
                    category_ids: [
                        categoryResult.find((cat) => cat.name === "Accessories")?.id!,
                    ],
                    description: `This wireless keyboard offers a comfortable typing experience with a numeric keypad and Touch ID. It features navigation buttons, full-sized arrow keys, and is ideal for spreadsheets and gaming. The rechargeable battery lasts about a month. It pairs automatically with compatible computers and includes a USB-C to Lightning cable for charging and pairing.`,
                    weight: 400,
                    status: ProductStatus.PUBLISHED,
                    images: [
                        {
                            url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/mouse-top.png",
                        },
                        {
                            url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/mouse-front.png",
                        },
                    ],
                    options: [
                        {
                            title: "Color",
                            values: ["Black", "White"],
                        },
                    ],
                    variants: [
                        {
                            title: "Mouse Black",
                            sku: "MOUSE-BLACK",
                            options: {
                                Color: "Black",
                            },
                            manage_inventory: true,
                            prices: [
                                {
                                    amount: 79,
                                    currency_code: "eur",
                                },
                                {
                                    amount: 79,
                                    currency_code: "usd",
                                },
                            ],
                        },
                        {
                            title: "Mouse White",
                            sku: "MOUSE-WHITE",
                            options: {
                                Color: "White",
                            },
                            manage_inventory: true,
                            prices: [
                                {
                                    amount: 73,
                                    currency_code: "eur",
                                },
                                {
                                    amount: 2014500,
                                    currency_code: "vnd",
                                },
                                {
                                    amount: 323900,
                                    currency_code: "khr",
                                },
                                {
                                    amount: 1706400,
                                    currency_code: "lak",
                                },
                                {
                                    amount: 79,
                                    currency_code: "usd",
                                }
                            ],
                        },
                    ],
                    sales_channels: [
                        {
                            id: defaultSalesChannel[0].id,
                        },
                    ],
                },
            ],
        },
    });

    await createProductsWorkflow(container).run({
        input: {
            products: [
                {
                    title: "Conference Speaker | High-Performance | Budget-Friendly",
                    category_ids: [
                        categoryResult.find((cat) => cat.name === "Accessories")?.id!,
                    ],
                    description: `This compact, powerful conference speaker offers exceptional, high-performance features at a surprisingly affordable price. Packed with advanced productivity-enhancing technology, it delivers premium functionality without the premium price tag. Experience better meetings and improved communication, regardless of where your team members are calling from.`,
                    weight: 400,
                    status: ProductStatus.DRAFT,
                    images: [
                        {
                            url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/speaker-top.png",
                        },
                        {
                            url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/speaker-front.png",
                        },
                    ],
                    options: [
                        {
                            title: "Color",
                            values: ["Black", "White"],
                        },
                    ],
                    variants: [
                        {
                            title: "Speaker Black",
                            sku: "SPEAKER-BLACK",
                            options: {
                                Color: "Black",
                            },
                            manage_inventory: true,
                            prices: [
                                {
                                    amount: 73,
                                    currency_code: "eur",
                                },
                                {
                                    amount: 2014500,
                                    currency_code: "vnd",
                                },
                                {
                                    amount: 323900,
                                    currency_code: "khr",
                                },
                                {
                                    amount: 1706400,
                                    currency_code: "lak",
                                },
                                {
                                    amount: 79,
                                    currency_code: "usd",
                                }
                            ],
                        },
                        {
                            title: "Speaker White",
                            sku: "SPEAKER-WHITE",
                            options: {
                                Color: "White",
                            },
                            manage_inventory: true,
                            prices: [
                                {
                                    amount: 51,
                                    currency_code: "eur",
                                },
                                {
                                    amount: 1402500,
                                    currency_code: "vnd",
                                },
                                {
                                    amount: 225500,
                                    currency_code: "khr",
                                },
                                {
                                    amount: 1188000,
                                    currency_code: "lak",
                                },
                                {
                                    amount: 55,
                                    currency_code: "usd",
                                }
                            ],
                        },
                    ],
                    sales_channels: [
                        {
                            id: defaultSalesChannel[0].id,
                        },
                    ],
                },
            ],
        },
    });

    await createProductsWorkflow(container).run({
        input: {
            products: [
                {
                    title:
                        'Road 96',
                    collection_id: collection.id,
                    category_ids: [
                        categoryResult.find((cat) => cat.name === "Action & Adventure")?.id!,
                    ],
                    description:
                        "Road 96 is a crazy, beautiful road- trip. The discovery of exciting places, and unusual people on your own personal journey to freedom.\nAn ever - evolving story - driven adventure inspired by Tarantino, The Coen Brothers, and Bong Joon - ho. Made by the award - winning creators of Valiant Hearts and Memories Retold. Moments of action, exploration, contemplative melancholy, human encounters and wacky situations. Set against a backdrop of authoritarian rule and oppression. \nA stunning visual style, a soundtrack filled with 90s hits, and a thousand routes through the game combine so each player can create their own unique stories on Road 96.",
                    status: ProductStatus.PUBLISHED,
                    options: [
                        {
                            title: "Edition",
                            values: ["Standard", "Deluxe"],
                        },
                    ],
                    images: [
                        {
                            url: "https://store-images.s-microsoft.com/image/apps.33921.14401791124788682.a53b3c8e-a868-4dbf-845f-6db87942340c.32c2bc03-fbaf-42e2-8326-1e68d22fa8ea",
                        },
                        {
                            url: "https://store-images.s-microsoft.com/image/apps.10395.14401791124788682.a53b3c8e-a868-4dbf-845f-6db87942340c.b0c89347-5959-42b3-9b86-1fba086f8b31",
                        },
                        {
                            url: "https://store-images.s-microsoft.com/image/apps.8388.14401791124788682.a53b3c8e-a868-4dbf-845f-6db87942340c.bc9278fa-5e52-4fc5-821e-fb006cdf0d43",
                        },
                        {
                            url: "https://store-images.s-microsoft.com/image/apps.42930.14401791124788682.a53b3c8e-a868-4dbf-845f-6db87942340c.af2e13e6-3824-43f9-b62b-e92a2f476bbf",
                        },
                    ],
                    variants: [
                        {
                            title: "New Normal",
                            sku: "NEW-NORMAL-STANDARD",
                            manage_inventory: true,
                            prices: [
                                {
                                    amount: 18,
                                    currency_code: "eur",
                                },
                                {
                                    amount: 509700,
                                    currency_code: "vnd",
                                },
                                {
                                    amount: 82000,
                                    currency_code: "khr",
                                },
                                {
                                    amount: 431800,
                                    currency_code: "lak",
                                },
                                {
                                    amount: 19.99,
                                    currency_code: "usd",
                                }
                            ],
                            options: {
                                Edition: "Standard",
                            },
                        },
                        {
                            title: "New Normal",
                            sku: "NEW-NORMAL-DELUXE",
                            manage_inventory: true,
                            prices: [
                                {
                                    amount: 20,
                                    currency_code: "eur",
                                },
                                {
                                    amount: 560700,
                                    currency_code: "vnd",
                                },
                                {
                                    amount: 90200,
                                    currency_code: "khr",
                                },
                                {
                                    amount: 475000,
                                    currency_code: "lak",
                                },
                                {
                                    amount: 21.99,
                                    currency_code: "usd",
                                }
                            ],
                            options: {
                                Edition: "Deluxe",
                            },
                        },
                        {
                            title: "Mile 0",
                            sku: "MILE-0",
                            manage_inventory: true,
                            prices: [
                                {
                                    amount: 12,
                                    currency_code: "eur",
                                },
                                {
                                    amount: 331200,
                                    currency_code: "vnd",
                                },
                                {
                                    amount: 53300,
                                    currency_code: "khr",
                                },
                                {
                                    amount: 280600,
                                    currency_code: "lak",
                                },
                                {
                                    amount: 12.99,
                                    currency_code: "usd",
                                }
                            ],
                            options: {
                                Edition: "Standard",
                            },
                        },
                    ],
                    sales_channels: [
                        {
                            id: defaultSalesChannel[0].id,
                        },
                    ],
                },
            ],
        },
    });

    await createProductsWorkflow(container).run({
        input: {
            products: [
                {
                    title: "XBOX Series X",
                    category_ids: [
                        categoryResult.find((cat) => cat.name === "Consoles")?.id!,
                    ],
                    description:
                        "Xbox Series X, the fastest, most powerful Xbox ever. Explore rich new worlds with 12 teraflops of raw graphic processing power, DirectX ray tracing, a custom SSD, and 4K gaming. Make the most of every gaming minute with Quick Resume, lightning-fast load times, and gameplay of up to 120 FPS—all powered by Xbox Velocity Architecture. Enjoy thousands of games from four generations of Xbox, with hundreds of optimized titles that look and play better than ever. And when you add Xbox Game Pass Ultimate (membership sold separately), you get online multiplayer to play with friends and an instant library of 100+ high-quality games, including day one releases from Xbox Game Studios.",
                    status: ProductStatus.PUBLISHED,
                    images: [
                        {
                            url: "https://cms-assets.xboxservices.com/assets/bc/40/bc40fdf3-85a6-4c36-af92-dca2d36fc7e5.png?n=642227_Hero-Gallery-0_A1_857x676.png",
                        },
                        {
                            url: "https://cms-assets.xboxservices.com/assets/14/b5/14b5af73-466f-4584-9c7c-de5464af8c3b.png?n=642227_Hero-Gallery-0_A3_857x676.png",
                        },
                        {
                            url: "https://cms-assets.xboxservices.com/assets/c5/30/c53042dc-6a60-43f7-b1ff-0b4e018edbbe.png?n=642227_Hero-Gallery-0_A4_857x676.png",
                        },
                        {
                            url: "https://cms-assets.xboxservices.com/assets/5c/5b/5c5bf348-d948-4c48-b7cc-55aaf94f2782.png?n=642227_Hero-Gallery-0_B1_857x676.png",
                        },
                        {
                            url: "https://cms-assets.xboxservices.com/assets/63/5d/635d513d-a5b0-46e3-a665-97dede478295.png?n=642227_Hero-Gallery-0_B3_857x676.png",
                        },
                        {
                            url: "https://cms-assets.xboxservices.com/assets/df/d1/dfd18a77-3b9e-4550-b9fb-1784171b7353.png?n=642227_Hero-Gallery-0_B4_857x676.png",
                        },
                        {
                            url: "https://cms-assets.xboxservices.com/assets/37/d2/37d211d0-5c2c-42c6-bb71-ca7492c5e088.png?n=642227_Hero-Gallery-0_C1_857x676.png",
                        },
                        {
                            url: "https://cms-assets.xboxservices.com/assets/74/13/74131ebf-a57a-40c5-896a-70e4434186b1.png?n=642227_Hero-Gallery-0_C3_857x676.png",
                        },
                        {
                            url: "https://cms-assets.xboxservices.com/assets/d1/2c/d12cd3b8-3880-4dd4-8fe5-dc072a7904f0.png?n=642227_Hero-Gallery-0_C4_857x676.png",
                        },
                    ],
                    options: [
                        {
                            title: "Edition",
                            values: ["Disc Drive", "All Digital"],
                        },
                        {
                            title: "Storage",
                            values: ["1TB", "2TB"],
                        },
                        {
                            title: "Color",
                            values: ["Carbon Black", "Robot White", "Galaxy Black"],
                        },
                    ],
                    variants: [
                        {
                            title: "Xbox Series X – 1TB Carbon Black - Disc Drive",
                            sku: "XBOX-SERIES-X-1TB-CARBON-BLACK-DISC-DRIVE",
                            options: {
                                Edition: "Disc Drive",
                                Storage: "1TB",
                                Color: "Carbon Black",
                            },
                            manage_inventory: true,
                            prices: [
                                {
                                    amount: 460,
                                    currency_code: "eur",
                                },
                                {
                                    amount: 12749700,
                                    currency_code: "vnd",
                                },
                                {
                                    amount: 2050000,
                                    currency_code: "khr",
                                },
                                {
                                    amount: 10800000,
                                    currency_code: "lak",
                                },
                                {
                                    amount: 499.99,
                                    currency_code: "usd",
                                }
                            ],
                        },
                        {
                            title: "Xbox Series X – 1TB Robot White - All Digital",
                            sku: "XBOX-SERIES-X-1TB-ROBOT-WHITE-ALL-DIGITAL",
                            options: {
                                Edition: "All Digital",
                                Storage: "1TB",
                                Color: "Robot White",
                            },
                            manage_inventory: true,
                            prices: [
                                {
                                    amount: 414,
                                    currency_code: "eur",
                                },
                                {
                                    amount: 11474700,
                                    currency_code: "vnd",
                                },
                                {
                                    amount: 1845000,
                                    currency_code: "khr",
                                },
                                {
                                    amount: 9720000,
                                    currency_code: "lak",
                                },
                                {
                                    amount: 449.99,
                                    currency_code: "usd",
                                }
                            ],
                        },
                        {
                            title: "Xbox Series X – 2TB Galaxy Black - Disc Drive",
                            sku: "XBOX-SERIES-X-2TB-GALAXY-BLACK-DISC-DRIVE",
                            options: {
                                Edition: "Disc Drive",
                                Storage: "2TB",
                                Color: "Galaxy Black",
                            },
                            manage_inventory: true,
                            prices: [
                                {
                                    amount: 552,
                                    currency_code: "eur",
                                },
                                {
                                    amount: 15299700,
                                    currency_code: "vnd",
                                },
                                {
                                    amount: 2460000,
                                    currency_code: "khr",
                                },
                                {
                                    amount: 12960000,
                                    currency_code: "lak",
                                },
                                {
                                    amount: 599.99,
                                    currency_code: "usd",
                                }
                            ],
                        },
                    ],
                    sales_channels: [
                        {
                            id: defaultSalesChannel[0].id,
                        },
                    ],
                },
            ],
        },
    });
    logger.info("Finished seeding product data.");

    logger.info("Seeding inventory item data...");
    const inventoryItemIds = (await inventoryModuleService.listInventoryItems({
    })).map(item => item.id);
    await batchInventoryItemLevelsWorkflow(container)
        .run({
            input: {
                create: inventoryItemIds.map(id => {
                    return {
                        inventory_item_id: id,
                        location_id: stockLocation.id,
                        stocked_quantity: 100,
                    }
                })
            }
        });
    logger.info("Finished seeding inventory item data.");
    logger.info("Finished seeding store data...");

}
